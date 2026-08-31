import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailMessage } from '../../domain/entities/email-message.entity';
import { InvalidEmailMessageError } from '../../domain/errors/invalid-email-message.error';
import {
  EMAIL_MESSAGE_REPOSITORY,
  IEmailMessageRepository,
} from '../../domain/repositories/email-message.repository.interface';
import { SendEmailCommand } from '../commands/send-email.command';
import { EmailMessageDto } from '../dto/email-message.dto';
import { EmailMessageMapper } from '../mappers/email-message.mapper';
import { EMAIL_PUBLISHER, IEmailPublisher } from '../ports/email-publisher.interface';
import { OutboxEventType } from '@shared/outbox';

@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand> {
  constructor(
    @Inject(EMAIL_MESSAGE_REPOSITORY) private readonly emails: IEmailMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(EMAIL_PUBLISHER) private readonly publisher: IEmailPublisher,
  ) {}
  async execute(
    command: SendEmailCommand,
  ): Promise<Result<EmailMessageDto, InvalidEmailMessageError | ApplicationNotFoundError>> {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applications.findById(applicationId);
    if (
      !application ||
      (command.requestingTenantId && application.tenantId.value !== command.requestingTenantId)
    )
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    if (command.idempotencyKey) {
      const existing = await this.emails.findByIdempotencyKey(
        applicationId,
        command.idempotencyKey,
      );
      if (existing) return Result.ok(EmailMessageMapper.toDto(existing));
    }
    const result = EmailMessage.create({
      tenantId: application.tenantId,
      applicationId,
      to: command.to,
      subject: command.subject,
      textBody: command.textBody,
      htmlBody: command.htmlBody,
      idempotencyKey: command.idempotencyKey,
      requestId: command.requestId,
    });
    if (result.isFailure) return Result.fail(result.error);
    try {
      const outboxEvent = {
        eventType: OutboxEventType.EMAIL_REQUESTED,
        aggregateType: 'EmailMessage',
        aggregateId: result.value.id.value,
        tenantId: application.tenantId.value,
        payload: { emailMessageId: result.value.id.value },
      };
      if (this.emails.saveWithOutbox) {
        await this.emails.saveWithOutbox(result.value, outboxEvent);
      } else {
        await this.emails.save(result.value);
        await this.publisher.publishEmailRequested({ emailMessageId: result.value.id.value });
      }
    } catch (error: unknown) {
      if (command.idempotencyKey) {
        const concurrent = await this.emails.findByIdempotencyKey(
          applicationId,
          command.idempotencyKey,
        );
        if (concurrent) return Result.ok(EmailMessageMapper.toDto(concurrent));
      }
      throw error;
    }
    return Result.ok(EmailMessageMapper.toDto(result.value));
  }
}
