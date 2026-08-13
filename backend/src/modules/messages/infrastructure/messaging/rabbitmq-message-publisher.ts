import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  IMessagePublisher,
  MessageRequestedPayload,
} from '../../application/ports/message-publisher.interface';
import { MESSAGE_REQUESTED_DLQ, MESSAGE_REQUESTED_QUEUE } from './message-queues.constant';

@Injectable()
export class RabbitMqMessagePublisher implements IMessagePublisher {
  private readonly channelWrapper: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) private readonly connection: amqp.AmqpConnectionManager,
  ) {
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertQueue(MESSAGE_REQUESTED_DLQ, { durable: true }),
          channel.assertQueue(MESSAGE_REQUESTED_QUEUE, { durable: true }),
        ]),
    });
  }

  async publishMessageRequested(payload: MessageRequestedPayload): Promise<void> {
    await this.channelWrapper.sendToQueue(MESSAGE_REQUESTED_QUEUE, payload, { persistent: true });
  }

  async publishToDeadLetterQueue(payload: MessageRequestedPayload): Promise<void> {
    await this.channelWrapper.sendToQueue(MESSAGE_REQUESTED_DLQ, payload, { persistent: true });
  }
}
