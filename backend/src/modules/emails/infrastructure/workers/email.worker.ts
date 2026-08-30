import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import { EmailRequestedPayload } from '../../application/ports/email-publisher.interface';
import { EmailDeliveryProcessor } from '../../application/services/email-delivery-processor.service';
import { EMAIL_REQUESTED_DLQ, EMAIL_REQUESTED_QUEUE } from '../messaging/email-queues.constant';
@Injectable()
export class EmailWorker {
  private readonly channel: amqp.ChannelWrapper;
  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    private readonly processor: EmailDeliveryProcessor,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailWorker.name);
    this.channel = connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(EMAIL_REQUESTED_QUEUE, { durable: true });
        await channel.assertQueue(EMAIL_REQUESTED_DLQ, { durable: true });
        await channel.prefetch(10);
        await channel.consume(EMAIL_REQUESTED_QUEUE, (message) => {
          void this.handle(message, channel);
        });
      },
    });
  }
  private async handle(message: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!message) return;
    try {
      const payload = JSON.parse(message.content.toString()) as EmailRequestedPayload;
      await this.processor.process(payload.emailMessageId);
      channel.ack(message);
    } catch (error: unknown) {
      this.logger.error(
        { err: error },
        'Unexpected failure while processing email.requested event.',
      );
      channel.nack(message, false, true);
    }
  }
}
