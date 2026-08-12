import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import { MetaWebhookProcessor } from '../../application/services/meta-webhook.processor';
import {
  IWebhookEventRepository,
  WEBHOOK_EVENT_REPOSITORY,
} from '../repositories/postgres-webhook-event.repository';
import {
  META_WEBHOOK_RECEIVED_DLQ,
  META_WEBHOOK_RECEIVED_QUEUE,
} from '../messaging/webhook-queues.constant';

@Injectable()
export class MetaWebhookWorker {
  private readonly channel: amqp.ChannelWrapper;
  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    @Inject(WEBHOOK_EVENT_REPOSITORY) private readonly events: IWebhookEventRepository,
    private readonly processor: MetaWebhookProcessor,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MetaWebhookWorker.name);
    this.channel = connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(META_WEBHOOK_RECEIVED_QUEUE, { durable: true });
        await channel.assertQueue(META_WEBHOOK_RECEIVED_DLQ, { durable: true });
        await channel.consume(META_WEBHOOK_RECEIVED_QUEUE, (message) => {
          void this.handle(message, channel);
        });
      },
    });
  }
  private async handle(message: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!message) return;
    let eventId: string | null = null;
    try {
      eventId = this.parseEventId(message.content);
      if (!eventId) throw new Error('Invalid meta webhook queue payload.');
      const event = await this.events.findById(eventId);
      if (event?.status === 'PENDING') {
        await this.processor.process(event.payload);
        await this.events.markProcessed(event.id);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({ eventId, reason }, 'Meta webhook processing failed.');
      if (eventId) await this.events.markFailed(eventId, reason);
      await this.channel.sendToQueue(META_WEBHOOK_RECEIVED_DLQ, message.content, {
        persistent: true,
      });
    } finally {
      channel.ack(message);
    }
  }

  private parseEventId(content: Buffer): string | null {
    const value: unknown = JSON.parse(content.toString());
    if (!value || typeof value !== 'object' || !('eventId' in value)) return null;
    const eventId = value.eventId;
    return typeof eventId === 'string' && eventId.length > 0 ? eventId : null;
  }
}
