import { Inject, Injectable } from '@nestjs/common';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '@modules/messages/domain/repositories/message.repository.interface';
import {
  IMessageStatusWebhookPublisher,
  MESSAGE_STATUS_WEBHOOK_PUBLISHER,
} from '@modules/messages/application/ports/message-status-webhook-publisher.interface';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
  IApplicationPhoneNumberLinkRepository,
} from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import { PinoLogger } from 'nestjs-pino';
import {
  IInboundMessageWebhookPublisher,
  INBOUND_MESSAGE_WEBHOOK_PUBLISHER,
} from '../ports/inbound-message-webhook-publisher.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
} from '@modules/messages/application/ports/message-timeline.repository.interface';

interface MetaStatus {
  id?: string;
  status?: string;
}
interface MetaChange {
  field?: string;
  value?: {
    statuses?: MetaStatus[];
    messages?: Record<string, unknown>[];
    contacts?: MetaContact[];
    metadata?: { phone_number_id?: string };
  };
}
interface MetaContact {
  wa_id?: string;
  profile?: { name?: string };
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
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(APPLICATION_PHONE_NUMBER_LINK_REPOSITORY)
    private readonly links: IApplicationPhoneNumberLinkRepository,
    @Inject(INBOUND_MESSAGE_WEBHOOK_PUBLISHER)
    private readonly inboundMessageWebhookPublisher: IInboundMessageWebhookPublisher,
    private readonly logger: PinoLogger,
    @Inject(MESSAGE_TIMELINE_REPOSITORY) private readonly timeline?: IMessageTimelineRepository,
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
        const providerPhoneNumberId = change.value?.metadata?.phone_number_id;
        if (providerPhoneNumberId) {
          for (const message of change.value?.messages ?? [])
            await this.forwardInboundMessage(
              providerPhoneNumberId,
              message,
              change.value?.contacts ?? [],
            );
        }
      }
  }
  private async forwardInboundMessage(
    providerPhoneNumberId: string,
    message: Record<string, unknown>,
    contacts: MetaContact[],
  ): Promise<void> {
    const phoneNumber = await this.phoneNumbers.findByProviderPhoneNumberId(providerPhoneNumberId);
    if (!phoneNumber) return;
    const applicationIds = await this.links.listApplicationIdsByPhoneNumber(phoneNumber.id);
    const senderId = typeof message.from === 'string' ? message.from : '';
    const contact = contacts.find((item) => item.wa_id === senderId);
    for (const applicationId of applicationIds) {
      try {
        await this.inboundMessageWebhookPublisher.publishInboundMessageReceived({
          applicationId: applicationId.value,
          phoneNumberId: providerPhoneNumberId,
          sender: {
            id: contact?.wa_id ?? senderId,
            ...(contact?.profile?.name ? { displayName: contact.profile.name } : {}),
          },
          message,
          receivedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        this.logger.error(
          { err: error, applicationId: applicationId.value },
          'Failed to publish inbound message webhook event.',
        );
      }
    }
  }
  private async applyStatus(status: MetaStatus): Promise<void> {
    if (!status.id || !status.status) return;
    const message = await this.messages.findByProviderMessageId(status.id);
    if (!message?.applyProviderStatus(status.status)) return;
    await this.messages.save(message);
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'PROVIDER_STATUS_RECEIVED',
      status: message.status,
      source: 'META_WEBHOOK',
      metadata: { providerMessageId: status.id, providerStatus: status.status },
    });
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
