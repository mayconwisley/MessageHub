import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import { MessageRequestedPayload } from '../../application/ports/message-publisher.interface';
import { MessageDeliveryProcessor } from '../../application/services/message-delivery-processor.service';
import {
  MESSAGE_REQUESTED_DLQ,
  MESSAGE_REQUESTED_QUEUE,
} from '../messaging/message-queues.constant';

/**
 * Consumer de `message.requested` (secao 21/51). Assume at-least-once delivery: mensagens
 * ja processadas (status != PENDING/RETRY) sao ignoradas para preservar idempotencia.
 * A logica de negocio da entrega vive em MessageDeliveryProcessor; este worker apenas
 * conecta o consumo AMQP a ela.
 */
@Injectable()
export class MessageWorker {
  private readonly channelWrapper: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
    private readonly processor: MessageDeliveryProcessor,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageWorker.name);
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(MESSAGE_REQUESTED_DLQ, { durable: true });
        await channel.assertQueue(MESSAGE_REQUESTED_QUEUE, { durable: true });
        await channel.prefetch(10);
        await channel.consume(MESSAGE_REQUESTED_QUEUE, (msg) => {
          void this.handleMessage(msg, channel);
        });
      },
    });
  }

  private async handleMessage(msg: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!msg) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString()) as MessageRequestedPayload;
      await this.processor.process(payload.messageId);
      channel.ack(msg);
    } catch (error: unknown) {
      this.logger.error(
        { err: error },
        'Unexpected failure while processing message.requested event.',
      );
      channel.nack(msg, false, true);
    }
  }
}
