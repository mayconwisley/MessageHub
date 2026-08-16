import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  EMAIL_PUBLISHER,
  EmailRequestedPayload,
  IEmailPublisher,
} from '../../application/ports/email-publisher.interface';
import { EMAIL_REQUESTED_DLQ, EMAIL_REQUESTED_QUEUE } from './email-queues.constant';
@Injectable()
export class RabbitMqEmailPublisher implements IEmailPublisher {
  private readonly channel: amqp.ChannelWrapper;
  constructor(@Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager) {
    this.channel = connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertQueue(EMAIL_REQUESTED_QUEUE, { durable: true }),
          channel.assertQueue(EMAIL_REQUESTED_DLQ, { durable: true }),
        ]),
    });
  }
  async publishEmailRequested(payload: EmailRequestedPayload): Promise<void> {
    await this.channel.sendToQueue(EMAIL_REQUESTED_QUEUE, payload, { persistent: true });
  }
  async publishToDeadLetterQueue(payload: EmailRequestedPayload): Promise<void> {
    await this.channel.sendToQueue(EMAIL_REQUESTED_DLQ, payload, { persistent: true });
  }
}
