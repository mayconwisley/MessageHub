import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { Message } from '../../domain/entities/message.entity';
import { MessageAttempt } from '../../domain/entities/message-attempt.entity';
import { MessageAttemptStatus } from '../../domain/enums/message-attempt-status.enum';
import { MessageDeliveryRejectedError } from '../../domain/errors/message-delivery-rejected.error';
import {
  IMessageAttemptRepository,
  MESSAGE_ATTEMPT_REPOSITORY,
} from '../../domain/repositories/message-attempt.repository.interface';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageProvider,
  MESSAGE_PROVIDER,
  MessageDeliveryError,
} from '../ports/message-provider.interface';
import { IMessagePublisher, MESSAGE_PUBLISHER } from '../ports/message-publisher.interface';
import {
  IMessageStatusWebhookPublisher,
  MESSAGE_STATUS_WEBHOOK_PUBLISHER,
} from '../ports/message-status-webhook-publisher.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
} from '../ports/message-timeline.repository.interface';
import { MessageRetryPolicy } from './message-retry-policy';
import { OutboxEventType } from '@shared/outbox';

/**
 * Processa a entrega de uma mensagem `PENDING`/`RETRY` (secao 21/22/51): resolve o canal,
 * envia ao provedor, registra a tentativa e decide entre retry, DLQ ou sucesso.
 * Depende apenas de ports/repositorios, sem conhecer RabbitMQ - testavel sem broker real.
 */
@Injectable()
export class MessageDeliveryProcessor {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGE_ATTEMPT_REPOSITORY)
    private readonly messageAttemptRepository: IMessageAttemptRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(MESSAGE_PROVIDER) private readonly messageProvider: IMessageProvider,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
    @Inject(MESSAGE_STATUS_WEBHOOK_PUBLISHER)
    private readonly statusWebhookPublisher: IMessageStatusWebhookPublisher,
    private readonly retryPolicy: MessageRetryPolicy,
    private readonly logger: PinoLogger,
    @Inject(MESSAGE_TIMELINE_REPOSITORY) private readonly timeline?: IMessageTimelineRepository,
    private readonly alerts?: EngineeringAlertService,
  ) {
    this.logger.setContext(MessageDeliveryProcessor.name);
  }

  async process(messageId: string): Promise<void> {
    const message = this.messageRepository.claimForProcessing
      ? await this.messageRepository.claimForProcessing(UniqueId.create(messageId))
      : await this.claimForLegacyRepository(messageId);
    if (!message) {
      this.logger.warn({ messageId }, 'Message is not pending for delivery - skipping.');
      return;
    }
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'DELIVERY_ATTEMPT_STARTED',
      status: message.status,
      source: 'WORKER',
      attemptNumber: message.attemptCount,
    });

    const phoneNumber = await this.phoneNumberRepository.findById(message.phoneNumberId);
    const whatsAppAccount = phoneNumber
      ? await this.whatsAppAccountRepository.findById(phoneNumber.whatsAppAccountId)
      : null;

    if (!phoneNumber || !whatsAppAccount) {
      await this.handleFailure(
        message,
        new MessageDeliveryRejectedError(
          'Número de telefone ou conta do WhatsApp não encontrados.',
        ),
      );
      return;
    }

    const result = await this.messageProvider.send({
      phoneNumberId: phoneNumber.phoneNumberId,
      credentialSource: whatsAppAccount.credentialSource,
      accessToken: whatsAppAccount.accessToken,
      to: message.to,
      content: message.content.body,
      template: message.template,
    });

    if (result.isFailure) {
      await this.handleFailure(message, result.error);
      return;
    }

    const attempt = MessageAttempt.create({
      messageId: message.id,
      attemptNumber: message.attemptCount,
      status: MessageAttemptStatus.SUCCEEDED,
    });
    message.markSent(result.value.providerMessageId);
    await this.saveDeliveryOutcome(message, attempt, this.statusChangedEvent(message));
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'PROVIDER_ACCEPTED_MESSAGE',
      status: message.status,
      source: 'WORKER',
      attemptNumber: message.attemptCount,
      metadata: { providerMessageId: result.value.providerMessageId },
    });
    if (!this.messageRepository.saveWithOutbox) {
      await this.statusWebhookPublisher.publishMessageStatusChanged({
        applicationId: message.applicationId.value,
        messageId: message.id.value,
        status: message.status,
        occurredAt: message.updatedAt.toISOString(),
      });
    }
  }

  private async handleFailure(message: Message, error: MessageDeliveryError): Promise<void> {
    const attempt = MessageAttempt.create({
      messageId: message.id,
      attemptNumber: message.attemptCount,
      status: MessageAttemptStatus.FAILED,
      errorCode: error.code,
      errorMessage: error.message,
    });
    message.markFailed();
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'DELIVERY_ATTEMPT_FAILED',
      status: message.status,
      source: 'WORKER',
      attemptNumber: message.attemptCount,
      errorCode: error.code,
      errorMessage: error.message,
    });

    if (error.retryable && this.retryPolicy.shouldRetry(message.attemptCount)) {
      await this.scheduleRetry(message, attempt, error);
      return;
    }
    await this.saveDeliveryOutcome(message, attempt, [
      {
        eventType: OutboxEventType.MESSAGE_REQUESTED_DLQ,
        aggregateType: 'Message',
        aggregateId: message.id.value,
        tenantId: message.tenantId.value,
        payload: { messageId: message.id.value },
      },
      this.statusChangedEvent(message),
    ]);
    await this.sendToDeadLetterQueue(message, error);
  }

  private async scheduleRetry(
    message: Message,
    attempt: MessageAttempt,
    error: MessageDeliveryError,
  ): Promise<void> {
    message.scheduleRetry();
    const delayMs = this.retryPolicy.nextDelayMs(message.attemptCount);
    await this.saveDeliveryOutcome(message, attempt, {
      eventType: OutboxEventType.MESSAGE_REQUESTED,
      aggregateType: 'Message',
      aggregateId: message.id.value,
      tenantId: message.tenantId.value,
      payload: { messageId: message.id.value },
      availableAt: new Date(Date.now() + delayMs),
    });
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'RETRY_SCHEDULED',
      status: message.status,
      source: 'WORKER',
      attemptNumber: message.attemptCount,
      metadata: { delayMs, errorCode: error.code, errorMessage: error.message },
    });
    if (!this.messageRepository.saveWithOutbox) {
      const messageId = message.id.value;
      setTimeout(() => {
        void this.messagePublisher.publishMessageRequested({ messageId });
      }, delayMs);
    }
  }

  private async sendToDeadLetterQueue(
    message: Message,
    error: MessageDeliveryError,
  ): Promise<void> {
    if (!this.messageRepository.saveWithOutbox) {
      await this.messagePublisher.publishToDeadLetterQueue({ messageId: message.id.value });
      await this.statusWebhookPublisher.publishMessageStatusChanged({
        applicationId: message.applicationId.value,
        messageId: message.id.value,
        status: message.status,
        occurredAt: message.updatedAt.toISOString(),
      });
    }
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'DELIVERY_SENT_TO_DLQ',
      status: message.status,
      source: 'WORKER',
      attemptNumber: message.attemptCount,
      errorCode: error.code,
      errorMessage: error.message,
    });
    await this.alerts?.notify({
      type: 'MESSAGE_DLQ',
      severity: 'CRITICAL',
      title: 'Mensagem enviada para DLQ',
      message: `A mensagem ${message.id.value} esgotou todas as tentativas.`,
      metadata: {
        messageId: message.id.value,
        applicationId: message.applicationId.value,
        errorCode: error.code,
      },
    });
  }

  private statusChangedEvent(message: Message): {
    eventType: OutboxEventType.MESSAGE_STATUS_CHANGED;
    aggregateType: string;
    aggregateId: string;
    tenantId: string;
    payload: Record<string, unknown>;
  } {
    return {
      eventType: OutboxEventType.MESSAGE_STATUS_CHANGED,
      aggregateType: 'Message',
      aggregateId: message.id.value,
      tenantId: message.tenantId.value,
      payload: {
        applicationId: message.applicationId.value,
        messageId: message.id.value,
        status: message.status,
        occurredAt: message.updatedAt.toISOString(),
        attempt: 1,
      },
    };
  }

  private async claimForLegacyRepository(messageId: string): Promise<Message | null> {
    const message = await this.messageRepository.findById(UniqueId.create(messageId));
    if (!message) return null;
    try {
      message.markProcessing();
    } catch {
      return null;
    }
    await this.messageRepository.save(message);
    return message;
  }

  private async saveWithOutbox(
    message: Message,
    events: Parameters<NonNullable<IMessageRepository['saveWithOutbox']>>[1],
  ): Promise<void> {
    if (this.messageRepository.saveWithOutbox) {
      await this.messageRepository.saveWithOutbox(message, events);
      return;
    }
    await this.messageRepository.save(message);
  }

  private async saveDeliveryOutcome(
    message: Message,
    attempt: MessageAttempt,
    events: Parameters<NonNullable<IMessageRepository['saveDeliveryOutcome']>>[2],
  ): Promise<void> {
    if (this.messageRepository.saveDeliveryOutcome) {
      await this.messageRepository.saveDeliveryOutcome(message, attempt, events);
      return;
    }
    await this.messageAttemptRepository.save(attempt);
    if (events) {
      await this.saveWithOutbox(message, events);
      return;
    }
    await this.messageRepository.save(message);
  }
}
