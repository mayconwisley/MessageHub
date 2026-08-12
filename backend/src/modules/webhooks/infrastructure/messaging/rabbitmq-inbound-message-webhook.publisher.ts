import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  IInboundMessageWebhookPublisher,
  InboundMessageReceivedPayload,
} from '../../application/ports/inbound-message-webhook-publisher.interface';
import {
  INBOUND_MESSAGE_WEBHOOK_DLQ,
  INBOUND_MESSAGE_WEBHOOK_QUEUE,
} from './webhook-queues.constant';

@Injectable()
export class RabbitMqInboundMessageWebhookPublisher implements IInboundMessageWebhookPublisher {
  private readonly channelWrapper: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
  ) {
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertQueue(INBOUND_MESSAGE_WEBHOOK_DLQ, { durable: true }),
          channel.assertQueue(INBOUND_MESSAGE_WEBHOOK_QUEUE, { durable: true }),
        ]),
    });
  }

  async publishInboundMessageReceived(payload: InboundMessageReceivedPayload): Promise<void> {
    await this.channelWrapper.sendToQueue(
      INBOUND_MESSAGE_WEBHOOK_QUEUE,
      { ...payload, attempt: 1 },
      { persistent: true },
    );
  }
}
