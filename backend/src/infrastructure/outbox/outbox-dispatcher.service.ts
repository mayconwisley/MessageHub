import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { OutboxEventType } from '@shared/outbox';
import { RABBITMQ_CONNECTION } from '../messaging/rabbitmq/rabbitmq.constants';
import {
  EMAIL_REQUESTED_DLQ,
  EMAIL_REQUESTED_QUEUE,
} from '@modules/emails/infrastructure/messaging/email-queues.constant';
import {
  MESSAGE_REQUESTED_DLQ,
  MESSAGE_REQUESTED_QUEUE,
  MESSAGE_STATUS_WEBHOOK_QUEUE,
} from '@modules/messages/infrastructure/messaging/message-queues.constant';
import {
  INBOUND_MESSAGE_WEBHOOK_QUEUE,
  META_WEBHOOK_RECEIVED_QUEUE,
} from '@modules/webhooks/infrastructure/messaging/webhook-queues.constant';
import { OutboxEventOrmEntity } from '../database/entities/outbox-event.orm-entity';
import { OutboxRepository } from './outbox.repository';

const DISPATCH_INTERVAL_MS = 1_000;
const DISPATCH_BATCH_SIZE = 100;

@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnApplicationShutdown {
  private readonly channel: amqp.ChannelWrapper;
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    private readonly outbox: OutboxRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxDispatcherService.name);
    this.channel = connection.createChannel({
      json: true,
      confirm: true,
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(MESSAGE_REQUESTED_QUEUE, { durable: true }),
          channel.assertQueue(MESSAGE_REQUESTED_DLQ, { durable: true }),
          channel.assertQueue(EMAIL_REQUESTED_QUEUE, { durable: true }),
          channel.assertQueue(EMAIL_REQUESTED_DLQ, { durable: true }),
          channel.assertQueue(META_WEBHOOK_RECEIVED_QUEUE, { durable: true }),
          channel.assertQueue(INBOUND_MESSAGE_WEBHOOK_QUEUE, { durable: true }),
          channel.assertQueue(MESSAGE_STATUS_WEBHOOK_QUEUE, { durable: true }),
        ]);
      },
    });
  }

  onModuleInit(): void {
    this.timer = setInterval(() => void this.dispatch(), DISPATCH_INTERVAL_MS);
    this.timer.unref();
    void this.dispatch();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.channel.close();
  }

  private async dispatch(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const events = await this.outbox.claimBatch(DISPATCH_BATCH_SIZE);
      await Promise.all(events.map((event) => this.dispatchEvent(event)));
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'Failed to claim outbox events.');
    } finally {
      this.running = false;
    }
  }

  private async dispatchEvent(event: OutboxEventOrmEntity): Promise<void> {
    try {
      const queue = this.resolveQueue(event.eventType);
      await this.channel.sendToQueue(queue, event.payload, { persistent: true });
      await this.outbox.markProcessed(event.id);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unknown outbox dispatch error.';
      await this.outbox.reschedule(event.id, event.attemptCount, reason);
      this.logger.warn({ err: error, outboxEventId: event.id }, 'Outbox event dispatch failed.');
    }
  }

  private resolveQueue(eventType: string): string {
    switch (eventType) {
      case OutboxEventType.MESSAGE_REQUESTED:
        return MESSAGE_REQUESTED_QUEUE;
      case OutboxEventType.MESSAGE_REQUESTED_DLQ:
        return MESSAGE_REQUESTED_DLQ;
      case OutboxEventType.EMAIL_REQUESTED:
        return EMAIL_REQUESTED_QUEUE;
      case OutboxEventType.EMAIL_REQUESTED_DLQ:
        return EMAIL_REQUESTED_DLQ;
      case OutboxEventType.META_WEBHOOK_RECEIVED:
        return META_WEBHOOK_RECEIVED_QUEUE;
      case OutboxEventType.INBOUND_MESSAGE_WEBHOOK:
        return INBOUND_MESSAGE_WEBHOOK_QUEUE;
      case OutboxEventType.MESSAGE_STATUS_CHANGED:
        return MESSAGE_STATUS_WEBHOOK_QUEUE;
      default:
        throw new Error(`Unsupported outbox event type: ${eventType}`);
    }
  }
}
