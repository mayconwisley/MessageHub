import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';
import { UniqueId } from '@shared/domain';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageStatusWebhookPublisher,
  MESSAGE_STATUS_WEBHOOK_PUBLISHER,
} from '../../application/ports/message-status-webhook-publisher.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
} from '../../application/ports/message-timeline.repository.interface';

@Injectable()
export class SandboxWebhookSimulatorService {
  constructor(
    private readonly config: AppConfigService,
    @Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository,
    @Inject(MESSAGE_STATUS_WEBHOOK_PUBLISHER)
    private readonly statusPublisher: IMessageStatusWebhookPublisher,
    @Inject(MESSAGE_TIMELINE_REPOSITORY) private readonly timeline: IMessageTimelineRepository,
  ) {}

  async simulateStatus(messageId: string, status: 'DELIVERED' | 'READ' | 'FAILED'): Promise<void> {
    if (!this.config.sandboxEnabled) throw new NotFoundException();
    const message = await this.messages.findById(UniqueId.create(messageId));
    if (!message || !message.applyProviderStatus(status)) return;
    await this.messages.save(message);
    await this.timeline.record({
      messageId: message.id.value,
      eventType: 'SANDBOX_PROVIDER_STATUS_RECEIVED',
      status: message.status,
      source: 'SANDBOX',
      metadata: { simulatedStatus: status, providerMessageId: message.providerMessageId },
    });
    await this.statusPublisher.publishMessageStatusChanged({
      applicationId: message.applicationId.value,
      messageId: message.id.value,
      status: message.status,
      occurredAt: message.updatedAt.toISOString(),
    });
  }
}
