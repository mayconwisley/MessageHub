import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import { IWebhookEventPublisher } from '../../application/ports/webhook-event-publisher.interface';
import { META_WEBHOOK_RECEIVED_DLQ, META_WEBHOOK_RECEIVED_QUEUE } from './webhook-queues.constant';

@Injectable()
export class RabbitMqWebhookEventPublisher implements IWebhookEventPublisher {
  private readonly channel: amqp.ChannelWrapper;
  constructor(@Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager) {
    this.channel = connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertQueue(META_WEBHOOK_RECEIVED_QUEUE, { durable: true }),
          channel.assertQueue(META_WEBHOOK_RECEIVED_DLQ, { durable: true }),
        ]),
    });
  }
  async publishMetaWebhookReceived(eventId: string): Promise<void> {
    await this.channel.sendToQueue(
      META_WEBHOOK_RECEIVED_QUEUE,
      { eventId, attempt: 1 },
      { persistent: true },
    );
  }
}
