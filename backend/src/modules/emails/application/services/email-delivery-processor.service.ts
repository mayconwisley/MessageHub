import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import {
  SMTP_CONFIGURATION_RESOLVER,
  ISmtpConfigurationResolver,
} from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { EmailAttempt } from '../../domain/entities/email-attempt.entity';
import { EmailAttemptStatus } from '../../domain/enums/email-attempt-status.enum';
import { EmailStatus } from '../../domain/enums/email-status.enum';
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
import { EmailRetryPolicy } from './email-retry-policy';

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
  ) {
    this.logger.setContext(EmailDeliveryProcessor.name);
  }

  async process(emailMessageId: string): Promise<void> {
    const email = await this.emails.findById(UniqueId.create(emailMessageId));
    if (!email || ![EmailStatus.PENDING, EmailStatus.RETRY].includes(email.status)) return;
    email.markProcessing();
    await this.emails.save(email);
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
    await this.attempts.save(
      EmailAttempt.create({
        emailMessageId: email.id,
        attemptNumber: email.attemptCount,
        status: EmailAttemptStatus.SUCCEEDED,
        errorCode: null,
        errorMessage: null,
      }),
    );
    email.markSent(result.value.providerMessageId);
    await this.emails.save(email);
  }

  private async handleFailure(
    email: import('../../domain/entities/email-message.entity').EmailMessage,
    error: EmailDeliveryError | { code: string; message: string; retryable: boolean },
  ): Promise<void> {
    await this.attempts.save(
      EmailAttempt.create({
        emailMessageId: email.id,
        attemptNumber: email.attemptCount,
        status: EmailAttemptStatus.FAILED,
        errorCode: error.code,
        errorMessage: error.message,
      }),
    );
    email.markFailed();
    await this.emails.save(email);
    if (error.retryable && this.retryPolicy.shouldRetry(email.attemptCount)) {
      email.scheduleRetry();
      await this.emails.save(email);
      const delayMs = this.retryPolicy.nextDelayMs(email.attemptCount);
      setTimeout(() => {
        this.publisher
          .publishEmailRequested({ emailMessageId: email.id.value })
          .catch((publishError: unknown) =>
            this.logger.error(
              { err: publishError, emailMessageId: email.id.value },
              'Failed to requeue email.',
            ),
          );
      }, delayMs);
      return;
    }
    await this.publisher.publishToDeadLetterQueue({ emailMessageId: email.id.value });
  }
}
