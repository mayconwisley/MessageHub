import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';
import {
  SMTP_CONFIGURATION_RESOLVER,
  ISmtpConfigurationResolver,
} from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { EmailMessage } from '../../domain/entities/email-message.entity';
import { EmailAttempt } from '../../domain/entities/email-attempt.entity';
import { EmailAttemptStatus } from '../../domain/enums/email-attempt-status.enum';
import {
  EMAIL_ATTEMPT_REPOSITORY,
  IEmailAttemptRepository,
} from '../../domain/repositories/email-attempt.repository.interface';
import {
  EMAIL_MESSAGE_REPOSITORY,
  IEmailMessageRepository,
} from '../../domain/repositories/email-message.repository.interface';
import {
  EMAIL_PROVIDER,
  IEmailProvider,
  EmailDeliveryError,
} from '../ports/email-provider.interface';
import { EMAIL_PUBLISHER, IEmailPublisher } from '../ports/email-publisher.interface';
import {
  EMAIL_TIMELINE_REPOSITORY,
  IEmailTimelineRepository,
} from '../ports/email-timeline.repository.interface';
import { EmailRetryPolicy } from './email-retry-policy';
import { OutboxEventType } from '@shared/outbox';

@Injectable()
export class EmailDeliveryProcessor {
  constructor(
    @Inject(EMAIL_MESSAGE_REPOSITORY) private readonly emails: IEmailMessageRepository,
    @Inject(EMAIL_ATTEMPT_REPOSITORY) private readonly attempts: IEmailAttemptRepository,
    @Inject(SMTP_CONFIGURATION_RESOLVER)
    private readonly smtpConfigurations: ISmtpConfigurationResolver,
    @Inject(EMAIL_PROVIDER) private readonly provider: IEmailProvider,
    @Inject(EMAIL_PUBLISHER) private readonly publisher: IEmailPublisher,
    private readonly retryPolicy: EmailRetryPolicy,
    private readonly logger: PinoLogger,
    @Inject(EMAIL_TIMELINE_REPOSITORY) private readonly timeline?: IEmailTimelineRepository,
    private readonly alerts?: EngineeringAlertService,
  ) {
    this.logger.setContext(EmailDeliveryProcessor.name);
  }

  async process(emailMessageId: string): Promise<void> {
    const email = this.emails.claimForProcessing
      ? await this.emails.claimForProcessing(UniqueId.create(emailMessageId))
      : await this.claimForLegacyRepository(emailMessageId);
    if (!email) return;
    await this.timeline?.record({
      emailMessageId: email.id.value,
      eventType: 'DELIVERY_ATTEMPT_STARTED',
      status: email.status,
      source: 'WORKER',
      attemptNumber: email.attemptCount,
    });
    const configuration = await this.smtpConfigurations.resolve(email.tenantId);
    if (configuration.isFailure) {
      await this.handleFailure(email, {
        code: configuration.error.code,
        message: configuration.error.message,
        retryable: false,
      });
      return;
    }
    const result = await this.provider.send({
      to: email.to,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      smtp: configuration.value.settings,
    });
    if (result.isFailure) {
      await this.handleFailure(email, result.error);
      return;
    }
    const attempt = EmailAttempt.create({
      emailMessageId: email.id,
      attemptNumber: email.attemptCount,
      status: EmailAttemptStatus.SUCCEEDED,
      errorCode: null,
      errorMessage: null,
    });
    email.markSent(result.value.providerMessageId);
    await this.saveDeliveryOutcome(email, attempt);
    await this.timeline?.record({
      emailMessageId: email.id.value,
      eventType: 'PROVIDER_ACCEPTED_MESSAGE',
      status: email.status,
      source: 'WORKER',
      attemptNumber: email.attemptCount,
      metadata: { providerMessageId: result.value.providerMessageId },
    });
  }

  private async handleFailure(
    email: EmailMessage,
    error: EmailDeliveryError | { code: string; message: string; retryable: boolean },
  ): Promise<void> {
    const attempt = EmailAttempt.create({
      emailMessageId: email.id,
      attemptNumber: email.attemptCount,
      status: EmailAttemptStatus.FAILED,
      errorCode: error.code,
      errorMessage: error.message,
    });
    email.markFailed();
    await this.timeline?.record({
      emailMessageId: email.id.value,
      eventType: 'DELIVERY_ATTEMPT_FAILED',
      status: email.status,
      source: 'WORKER',
      attemptNumber: email.attemptCount,
      errorCode: error.code,
      errorMessage: error.message,
    });

    if (error.retryable && this.retryPolicy.shouldRetry(email.attemptCount)) {
      email.scheduleRetry();
      const delayMs = this.retryPolicy.nextDelayMs(email.attemptCount);
      await this.saveDeliveryOutcome(email, attempt, {
        eventType: OutboxEventType.EMAIL_REQUESTED,
        aggregateType: 'EmailMessage',
        aggregateId: email.id.value,
        tenantId: email.tenantId.value,
        payload: { emailMessageId: email.id.value },
        availableAt: new Date(Date.now() + delayMs),
      });
      await this.timeline?.record({
        emailMessageId: email.id.value,
        eventType: 'RETRY_SCHEDULED',
        status: email.status,
        source: 'WORKER',
        attemptNumber: email.attemptCount,
        metadata: { delayMs, errorCode: error.code, errorMessage: error.message },
      });
      if (!this.emails.saveWithOutbox) {
        const emailMessageId = email.id.value;
        setTimeout(() => {
          void this.publisher.publishEmailRequested({ emailMessageId });
        }, delayMs);
      }
      return;
    }
    await this.saveDeliveryOutcome(email, attempt, {
      eventType: OutboxEventType.EMAIL_REQUESTED_DLQ,
      aggregateType: 'EmailMessage',
      aggregateId: email.id.value,
      tenantId: email.tenantId.value,
      payload: { emailMessageId: email.id.value },
    });
    await this.timeline?.record({
      emailMessageId: email.id.value,
      eventType: 'DELIVERY_SENT_TO_DLQ',
      status: email.status,
      source: 'WORKER',
      attemptNumber: email.attemptCount,
      errorCode: error.code,
      errorMessage: error.message,
    });
    if (!this.emails.saveWithOutbox) {
      await this.publisher.publishToDeadLetterQueue({ emailMessageId: email.id.value });
    }
    await this.alerts?.notify({
      type: 'EMAIL_DLQ',
      severity: 'CRITICAL',
      title: 'E-mail enviado para DLQ',
      message: `O e-mail ${email.id.value} esgotou todas as tentativas.`,
      metadata: {
        emailMessageId: email.id.value,
        applicationId: email.applicationId.value,
        errorCode: error.code,
      },
    });
  }

  private async claimForLegacyRepository(emailMessageId: string): Promise<EmailMessage | null> {
    const email = await this.emails.findById(UniqueId.create(emailMessageId));
    if (!email) return null;
    try {
      email.markProcessing();
    } catch {
      return null;
    }
    await this.emails.save(email);
    return email;
  }

  private async saveWithOutbox(
    email: EmailMessage,
    events: Parameters<NonNullable<IEmailMessageRepository['saveWithOutbox']>>[1],
  ): Promise<void> {
    if (this.emails.saveWithOutbox) {
      await this.emails.saveWithOutbox(email, events);
      return;
    }
    await this.emails.save(email);
  }

  private async saveDeliveryOutcome(
    email: EmailMessage,
    attempt: EmailAttempt,
    events?: Parameters<NonNullable<IEmailMessageRepository['saveDeliveryOutcome']>>[2],
  ): Promise<void> {
    if (this.emails.saveDeliveryOutcome) {
      await this.emails.saveDeliveryOutcome(email, attempt, events);
      return;
    }
    await this.attempts.save(attempt);
    if (events) {
      await this.saveWithOutbox(email, events);
      return;
    }
    await this.emails.save(email);
  }
}
