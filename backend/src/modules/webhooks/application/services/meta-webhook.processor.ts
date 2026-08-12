import { Inject, Injectable } from '@nestjs/common';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '@modules/messages/domain/repositories/message.repository.interface';

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
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository) {}
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
    if (message?.applyProviderStatus(status.status)) await this.messages.save(message);
  }
}
