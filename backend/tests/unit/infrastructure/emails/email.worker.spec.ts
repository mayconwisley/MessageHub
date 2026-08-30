import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { EmailDeliveryProcessor } from '@modules/emails/application/services/email-delivery-processor.service';
import { EmailWorker } from '@modules/emails/infrastructure/workers/email.worker';
import { EMAIL_REQUESTED_DLQ } from '@modules/emails/infrastructure/messaging/email-queues.constant';

interface ChannelWrapperStub {
  sendToQueue: jest.Mock<Promise<void>, [string, Buffer, { persistent: boolean }]>;
}

interface ChannelStub {
  ack: jest.Mock<void, [ConsumeMessage]>;
  nack: jest.Mock<void, [ConsumeMessage, boolean, boolean]>;
}

interface EmailWorkerInternals {
  handle(message: ConsumeMessage | null, channel: Channel): Promise<void>;
}

function buildWorker(sendToQueue: ChannelWrapperStub['sendToQueue']) {
  const channelWrapper: ChannelWrapperStub = { sendToQueue };
  const connection = {
    createChannel: jest.fn().mockReturnValue(channelWrapper),
  } as unknown as amqp.AmqpConnectionManager;
  const processor = {
    process: jest.fn().mockRejectedValue(new Error('Unexpected processor failure')),
  } as unknown as EmailDeliveryProcessor;
  const logger = {
    setContext: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
  const worker = new EmailWorker(connection, processor, logger);
  const channel: ChannelStub = {
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const message = {
    content: Buffer.from(JSON.stringify({ emailMessageId: 'email-1' })),
  } as unknown as ConsumeMessage;

  return { worker, channel, message };
}

describe('EmailWorker', () => {
  it('move falha inesperada para DLQ e confirma a mensagem original', async () => {
    const sendToQueue = jest
      .fn<Promise<void>, [string, Buffer, { persistent: boolean }]>()
      .mockResolvedValue(undefined);
    const { worker, channel, message } = buildWorker(sendToQueue);

    await (worker as unknown as EmailWorkerInternals).handle(
      message,
      channel as unknown as Channel,
    );

    expect(sendToQueue).toHaveBeenCalledWith(EMAIL_REQUESTED_DLQ, message.content, {
      persistent: true,
    });
    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('reencaminha para a fila somente quando a publicação na DLQ falha', async () => {
    const sendToQueue = jest
      .fn<Promise<void>, [string, Buffer, { persistent: boolean }]>()
      .mockRejectedValue(new Error('DLQ unavailable'));
    const { worker, channel, message } = buildWorker(sendToQueue);

    await (worker as unknown as EmailWorkerInternals).handle(
      message,
      channel as unknown as Channel,
    );

    expect(channel.ack).not.toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });
});
