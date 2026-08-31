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
const QUEUE_BY_EVENT_TYPE: Readonly<Record<string, string>> = {
  [OutboxEventType.MESSAGE_REQUESTED]: MESSAGE_REQUESTED_QUEUE,
  [OutboxEventType.MESSAGE_REQUESTED_DLQ]: MESSAGE_REQUESTED_DLQ,
  [OutboxEventType.EMAIL_REQUESTED]: EMAIL_REQUESTED_QUEUE,
  [OutboxEventType.EMAIL_REQUESTED_DLQ]: EMAIL_REQUESTED_DLQ,
  [OutboxEventType.META_WEBHOOK_RECEIVED]: META_WEBHOOK_RECEIVED_QUEUE,
  [OutboxEventType.INBOUND_MESSAGE_WEBHOOK]: INBOUND_MESSAGE_WEBHOOK_QUEUE,
  [OutboxEventType.MESSAGE_STATUS_CHANGED]: MESSAGE_STATUS_WEBHOOK_QUEUE,
};

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
      // A ordem de `occurredAt` é relevante para mudanças de estado do mesmo
      // agregado. O dispatcher preserva a ordem observada dentro do lote.
      for (const event of events) {
        await this.dispatchEvent(event);
      }
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
    const queue = QUEUE_BY_EVENT_TYPE[eventType];
    if (!queue) throw new Error(`Unsupported outbox event type: ${eventType}`);
    return queue;
  }
}
