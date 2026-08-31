import { createHmac } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { assertSafeWebhookUrl, safeWebhookHttpsAgent } from '@shared/security';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { MessageRetryPolicy } from '../../application/services/message-retry-policy';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';
import { OutboxEventType } from '@shared/outbox';
import {
  MESSAGE_STATUS_WEBHOOK_DLQ,
  MESSAGE_STATUS_WEBHOOK_QUEUE,
} from '../messaging/message-queues.constant';

interface MessageStatusWebhookQueuePayload {
  applicationId: string;
  messageId: string;
  status: string;
  occurredAt: string;
  attempt: number;
}

const DELIVERY_TIMEOUT_MS = 5_000;

/** Entrega assincrona do webhook de status ao callback configurado pelo tenant, com retry/backoff e assinatura HMAC. */
@Injectable()
export class MessageStatusWebhookWorker {
  private readonly channel: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    private readonly retryPolicy: MessageRetryPolicy,
    private readonly logger: PinoLogger,
    private readonly outbox: OutboxRepository,
  ) {
    this.logger.setContext(MessageStatusWebhookWorker.name);
    this.channel = connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(MESSAGE_STATUS_WEBHOOK_QUEUE, { durable: true });
        await channel.assertQueue(MESSAGE_STATUS_WEBHOOK_DLQ, { durable: true });
        await channel.prefetch(10);
        await channel.consume(MESSAGE_STATUS_WEBHOOK_QUEUE, (message) => {
          void this.handle(message, channel);
        });
      },
    });
  }

  private async handle(message: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!message) return;
    let payload: MessageStatusWebhookQueuePayload | null = null;
    let shouldAck = false;
    try {
      payload = this.parsePayload(message.content);
      const application = await this.applications.findById(UniqueId.create(payload.applicationId));
      if (!application?.webhookUrl || !application.webhookSecret) {
        shouldAck = true;
        return;
      }
      await assertSafeWebhookUrl(application.webhookUrl);

      const body = JSON.stringify({
        event: 'message.status_updated',
        data: {
          messageId: payload.messageId,
          applicationId: payload.applicationId,
          status: payload.status,
          occurredAt: payload.occurredAt,
        },
      });
      const signature = createHmac('sha256', application.webhookSecret).update(body).digest('hex');

      await axios.post(application.webhookUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
        },
        timeout: DELIVERY_TIMEOUT_MS,
        httpsAgent: safeWebhookHttpsAgent,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 300,
      });
      shouldAck = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      const attempt = payload?.attempt ?? 1;

      if (payload && this.retryPolicy.shouldRetry(attempt)) {
        const delayMs = this.retryPolicy.nextDelayMs(attempt);
        this.logger.warn(
          { payload, reason, delayMs },
          'Outbound message status webhook delivery failed - scheduling retry.',
        );
        await this.outbox.add({
          eventType: OutboxEventType.MESSAGE_STATUS_CHANGED,
          aggregateType: 'MessageStatusWebhook',
          aggregateId: payload.messageId,
          payload: { ...payload, attempt: attempt + 1 },
          availableAt: new Date(Date.now() + delayMs),
        });
        shouldAck = true;
      } else {
        this.logger.error(
          { payload, reason },
          'Outbound message status webhook delivery failed permanently - sending to DLQ.',
        );
        await this.channel.sendToQueue(MESSAGE_STATUS_WEBHOOK_DLQ, message.content, {
          persistent: true,
        });
        shouldAck = true;
      }
    } finally {
      if (shouldAck) channel.ack(message);
      else channel.nack(message, false, true);
    }
  }

  private parsePayload(content: Buffer): MessageStatusWebhookQueuePayload {
    const value = JSON.parse(content.toString()) as Partial<MessageStatusWebhookQueuePayload>;
    if (!value.applicationId || !value.messageId || !value.status || !value.occurredAt) {
      throw new Error('Invalid message status webhook queue payload.');
    }
    return {
      applicationId: value.applicationId,
      messageId: value.messageId,
      status: value.status,
      occurredAt: value.occurredAt,
      attempt: typeof value.attempt === 'number' && value.attempt > 0 ? value.attempt : 1,
    };
  }
}
