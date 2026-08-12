import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  IMessageStatusWebhookPublisher,
  MessageStatusChangedPayload,
} from '../../application/ports/message-status-webhook-publisher.interface';
import {
  MESSAGE_STATUS_WEBHOOK_DLQ,
  MESSAGE_STATUS_WEBHOOK_QUEUE,
} from './message-queues.constant';

@Injectable()
export class RabbitMqMessageStatusWebhookPublisher implements IMessageStatusWebhookPublisher {
  private readonly channelWrapper: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
  ) {
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertQueue(MESSAGE_STATUS_WEBHOOK_DLQ, { durable: true }),
          channel.assertQueue(MESSAGE_STATUS_WEBHOOK_QUEUE, { durable: true }),
        ]),
    });
  }

  async publishMessageStatusChanged(payload: MessageStatusChangedPayload): Promise<void> {
    await this.channelWrapper.sendToQueue(
      MESSAGE_STATUS_WEBHOOK_QUEUE,
      { ...payload, attempt: 1 },
      { persistent: true },
    );
  }
}
