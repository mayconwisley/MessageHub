import { createHmac } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { RABBITMQ_CONNECTION } from '@infrastructure/messaging/rabbitmq/rabbitmq.constants';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { WebhookRetryPolicy } from '../../application/services/webhook-retry-policy';
import {
  INBOUND_MESSAGE_WEBHOOK_DLQ,
  INBOUND_MESSAGE_WEBHOOK_QUEUE,
} from '../messaging/webhook-queues.constant';

interface InboundMessageWebhookQueuePayload {
  applicationId: string;
  phoneNumberId: string;
  sender: {
    id: string;
    displayName?: string;
  };
  message: Record<string, unknown>;
  receivedAt: string;
  attempt: number;
}

const DELIVERY_TIMEOUT_MS = 5_000;

/** Entrega assincrona do webhook de mensagem recebida ao callback configurado pela Application, com retry/backoff e assinatura HMAC. */
@Injectable()
export class InboundMessageWebhookWorker {
  private readonly channel: amqp.ChannelWrapper;

  constructor(
    @Inject(RABBITMQ_CONNECTION) connection: amqp.AmqpConnectionManager,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    private readonly retryPolicy: WebhookRetryPolicy,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InboundMessageWebhookWorker.name);
    this.channel = connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertQueue(INBOUND_MESSAGE_WEBHOOK_QUEUE, { durable: true });
        await channel.assertQueue(INBOUND_MESSAGE_WEBHOOK_DLQ, { durable: true });
        await channel.consume(INBOUND_MESSAGE_WEBHOOK_QUEUE, (message) => {
          void this.handle(message, channel);
        });
      },
    });
  }

  private async handle(message: ConsumeMessage | null, channel: Channel): Promise<void> {
    if (!message) return;
    let payload: InboundMessageWebhookQueuePayload | null = null;
    try {
      payload = this.parsePayload(message.content);
      const application = await this.applications.findById(UniqueId.create(payload.applicationId));
      if (!application?.webhookUrl || !application.webhookSecret) {
        return;
      }

      const body = JSON.stringify({
        event: 'whatsapp.message_received',
        data: {
          applicationId: payload.applicationId,
          phoneNumberId: payload.phoneNumberId,
          sender: payload.sender,
          message: payload.message,
          receivedAt: payload.receivedAt,
        },
      });
      const signature = createHmac('sha256', application.webhookSecret).update(body).digest('hex');

      await axios.post(application.webhookUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`,
        },
        timeout: DELIVERY_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 300,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      const attempt = payload?.attempt ?? 1;

      if (payload && this.retryPolicy.shouldRetry(attempt)) {
        const delayMs = this.retryPolicy.nextDelayMs(attempt);
        this.logger.warn(
          { payload, reason, delayMs },
          'Inbound message webhook delivery failed - scheduling retry.',
        );
        const nextPayload = { ...payload, attempt: attempt + 1 };
        setTimeout(() => {
          this.channel
            .sendToQueue(INBOUND_MESSAGE_WEBHOOK_QUEUE, nextPayload, { persistent: true })
            .catch((publishError: unknown) => {
              this.logger.error(
                { err: publishError, payload: nextPayload },
                'Failed to requeue inbound message webhook for retry.',
              );
            });
        }, delayMs);
      } else {
        this.logger.error(
          { payload, reason },
          'Inbound message webhook delivery failed permanently - sending to DLQ.',
        );
        await this.channel.sendToQueue(INBOUND_MESSAGE_WEBHOOK_DLQ, message.content, {
          persistent: true,
        });
      }
    } finally {
      channel.ack(message);
    }
  }

  private parsePayload(content: Buffer): InboundMessageWebhookQueuePayload {
    const value = JSON.parse(content.toString()) as Partial<InboundMessageWebhookQueuePayload>;
    if (
      !value.applicationId ||
      !value.phoneNumberId ||
      !value.sender?.id ||
      !value.message ||
      !value.receivedAt
    ) {
      throw new Error('Invalid inbound message webhook queue payload.');
    }
    return {
      applicationId: value.applicationId,
      phoneNumberId: value.phoneNumberId,
      sender: value.sender,
      message: value.message,
      receivedAt: value.receivedAt,
      attempt: typeof value.attempt === 'number' && value.attempt > 0 ? value.attempt : 1,
    };
  }
}
