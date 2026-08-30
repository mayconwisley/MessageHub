import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import { MetaWebhookProcessor } from '../../application/services/meta-webhook.processor';
import { WebhookRetryPolicy } from '../../application/services/webhook-retry-policy';
import {
  IWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from '../repositories/postgres-webhook-event.repository';
import {
  META_WEBHOOK_RECEIVED_DLQ,
  META_WEBHOOK_RECEIVED_QUEUE,
} from '../messaging/webhook-queues.constant';
import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';
import { OutboxEventType } from '@shared/outbox';

interface MetaWebhookQueuePayload {
  eventId: string;
  attempt: number;
}

@Injectable()
export class MetaWebhookWorker {
  private readonly channel: amqp.ChannelWrapper;
  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    @Inject(WEBHOOK_EVENT_REPOSITORY) private readonly events: IWebhookEventRepository,
    private readonly processor: MetaWebhookProcessor,
    private readonly retryPolicy: WebhookRetryPolicy,
    private readonly logger: PinoLogger,
    private readonly alerts?: EngineeringAlertService,
    private readonly outbox?: OutboxRepository,
  ) {
    this.logger.setContext(MetaWebhookWorker.name);
    this.channel = connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(META_WEBHOOK_RECEIVED_QUEUE, { durable: true });
        await channel.assertQueue(META_WEBHOOK_RECEIVED_DLQ, { durable: true });
        await channel.prefetch(10);
        await channel.consume(META_WEBHOOK_RECEIVED_QUEUE, (message) => {
          void this.handle(message, channel);
        });
      },
    });
  }
  private async handle(message: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!message) return;
    let eventId: string | null = null;
    let attempt = 1;
    let shouldAck = false;
    try {
      const payload = this.parsePayload(message.content);
      eventId = payload.eventId;
      attempt = payload.attempt;
      if (!eventId) throw new Error('Invalid meta webhook queue payload.');
      const event = await this.events.findById(eventId);
      if (event?.status === 'PENDING') {
        await this.events.markAttempted(event.id);
        await this.processor.process(event.payload);
        await this.events.markProcessed(event.id);
      }
      shouldAck = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';

      if (eventId && this.retryPolicy.shouldRetry(attempt)) {
        const delayMs = this.retryPolicy.nextDelayMs(attempt);
        this.logger.warn(
          { eventId, attempt, reason, delayMs },
          'Meta webhook processing failed - scheduling retry.',
        );
        if (!this.outbox) throw error;
        await this.outbox.add({
          eventType: OutboxEventType.META_WEBHOOK_RECEIVED,
          aggregateType: 'WebhookEvent',
          aggregateId: eventId,
          payload: { eventId, attempt: attempt + 1 },
          availableAt: new Date(Date.now() + delayMs),
        });
        shouldAck = true;
      } else {
        this.logger.error(
          { eventId, attempt, reason },
          'Meta webhook processing failed permanently - sending to DLQ.',
        );
        if (eventId) await this.events.markFailed(eventId, reason);
        await this.alerts?.notify({
          type: 'META_WEBHOOK_DLQ',
          severity: 'CRITICAL',
          title: 'Webhook Meta enviado para DLQ',
          message: `O evento ${eventId ?? 'desconhecido'} esgotou todas as tentativas.`,
          metadata: { eventId, reason },
        });
        await this.channel.sendToQueue(META_WEBHOOK_RECEIVED_DLQ, message.content, {
          persistent: true,
        });
        shouldAck = true;
      }
    } finally {
      if (shouldAck) channel.ack(message);
      else channel.nack(message, false, true);
    }
  }

  private parsePayload(content: Buffer): MetaWebhookQueuePayload {
    const value: unknown = JSON.parse(content.toString());
    if (!value || typeof value !== 'object' || !('eventId' in value)) {
      return { eventId: '', attempt: 1 };
    }
    const eventId = value.eventId;
    const rawAttempt = (value as { attempt?: unknown }).attempt;
    return {
      eventId: typeof eventId === 'string' ? eventId : '',
      attempt: typeof rawAttempt === 'number' && rawAttempt > 0 ? rawAttempt : 1,
    };
  }
}
