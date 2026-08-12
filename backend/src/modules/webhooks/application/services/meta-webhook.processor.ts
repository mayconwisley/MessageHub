import { Inject, Injectable } from '@nestjs/common';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '@modules/messages/domain/repositories/message.repository.interface';
import {
  IMessageStatusWebhookPublisher,
  MESSAGE_STATUS_WEBHOOK_PUBLISHER,
} from '@modules/messages/application/ports/message-status-webhook-publisher.interface';
import { PinoLogger } from 'nestjs-pino';

interface MetaStatus {
  id?: string;
  status?: string;
}
interface MetaChange {
  field?: string;
  value?: { statuses?: MetaStatus[] };
}
interface MetaWebhookPayload {
  object?: string;
  entry?: { changes?: MetaChange[] }[];
}

@Injectable()
export class MetaWebhookProcessor {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository,
    @Inject(MESSAGE_STATUS_WEBHOOK_PUBLISHER)
    private readonly statusWebhookPublisher: IMessageStatusWebhookPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MetaWebhookProcessor.name);
  }
  async process(payload: Record<string, unknown>): Promise<void> {
    const webhook = payload as MetaWebhookPayload;
    if (webhook.object !== 'whatsapp_business_account') return;
    for (const entry of webhook.entry ?? [])
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        for (const status of change.value?.statuses ?? []) await this.applyStatus(status);
      }
  }
  private async applyStatus(status: MetaStatus): Promise<void> {
    if (!status.id || !status.status) return;
    const message = await this.messages.findByProviderMessageId(status.id);
    if (!message?.applyProviderStatus(status.status)) return;
    await this.messages.save(message);
    try {
      await this.statusWebhookPublisher.publishMessageStatusChanged({
        applicationId: message.applicationId.value,
        messageId: message.id.value,
        status: message.status,
        occurredAt: message.updatedAt.toISOString(),
      });
    } catch (error: unknown) {
      this.logger.error(
        { err: error, messageId: message.id.value },
        'Failed to publish outbound message status webhook event.',
      );
    }
  }
}
