import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { RateLimitExceededError } from '@shared/errors';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import { Message } from '../../domain/entities/message.entity';
import { InvalidMessageError } from '../../domain/errors/invalid-message.error';
import { AmbiguousPhoneNumberError } from '../../domain/errors/ambiguous-phone-number.error';
import { PhoneNumberNotConfiguredError } from '../../domain/errors/phone-number-not-configured.error';
import { IdempotencyKeyConflictError } from '../../domain/errors/idempotency-key-conflict.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import { SendMessageCommand } from '../commands/send-message.command';
import { SendMessageResultDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { IMessagePublisher, MESSAGE_PUBLISHER } from '../ports/message-publisher.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
} from '../ports/message-timeline.repository.interface';
import { PhoneNumberResolverService } from '../services/phone-number-resolver.service';
import { OutboxEventType } from '@shared/outbox';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    private readonly phoneNumberResolver: PhoneNumberResolverService,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
    @Inject(MESSAGE_TIMELINE_REPOSITORY) private readonly timeline?: IMessageTimelineRepository,
  ) {}

  async execute(
    command: SendMessageCommand,
  ): Promise<
    Result<
      SendMessageResultDto,
      | InvalidMessageError
      | ApplicationNotFoundError
      | PhoneNumberNotFoundError
      | PhoneNumberNotConfiguredError
      | AmbiguousPhoneNumberError
      | RateLimitExceededError
      | IdempotencyKeyConflictError
    >
  > {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }
    if (command.requestingTenantId && application.tenantId.value !== command.requestingTenantId) {
      // Nunca revelar que a Application existe em outro tenant (secao 17).
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const phoneNumberResult = await this.phoneNumberResolver.resolve(
      application,
      command.phoneNumberId,
    );
    if (phoneNumberResult.isFailure) {
      return Result.fail(phoneNumberResult.error);
    }
    const phoneNumber = phoneNumberResult.value;
    const phoneNumberId = phoneNumber.id;

    if (command.idempotencyKey) {
      const existing = await this.messageRepository.findByIdempotencyKey(
        applicationId,
        command.idempotencyKey,
      );
      if (existing) {
        if (!this.matchesReplayPayload(existing, command.to, command.content, phoneNumberId)) {
          return Result.fail(new IdempotencyKeyConflictError(command.idempotencyKey));
        }
        return Result.ok({ message: MessageMapper.toDto(existing), isReplay: true });
      }
    }

    const messageResult = Message.create({
      tenantId: application.tenantId,
      applicationId,
      phoneNumberId,
      to: command.to,
      content: command.content,
      idempotencyKey: command.idempotencyKey,
      requestId: command.requestId,
    });
    if (messageResult.isFailure) {
      return Result.fail(messageResult.error);
    }

    const message = messageResult.value;
    const saveResult = await this.messageRepository.saveWithQuotaCheck(
      message,
      {
        perMinute: application.quotaPerMinute,
        perDay: application.quotaPerDay,
      },
      {
        eventType: OutboxEventType.MESSAGE_REQUESTED,
        aggregateType: 'Message',
        aggregateId: message.id.value,
        tenantId: application.tenantId.value,
        payload: { messageId: message.id.value },
      },
    );
    if (saveResult.outcome === 'rate_limited') {
      const scopeLabel =
        saveResult.scope === 'minute'
          ? 'quota por minuto da aplicação'
          : 'quota diária da aplicação';
      return Result.fail(new RateLimitExceededError(scopeLabel));
    }
    if (saveResult.outcome === 'idempotent_conflict') {
      if (
        command.idempotencyKey &&
        !this.matchesReplayPayload(saveResult.existing, command.to, command.content, phoneNumberId)
      ) {
        return Result.fail(new IdempotencyKeyConflictError(command.idempotencyKey));
      }
      return Result.ok({ message: MessageMapper.toDto(saveResult.existing), isReplay: true });
    }
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'MESSAGE_ACCEPTED',
      status: message.status,
      source: 'API',
      metadata: { requestId: message.requestId, idempotencyKey: message.idempotencyKey },
    });
    if (!saveResult.outboxPersisted) {
      await this.messagePublisher.publishMessageRequested({ messageId: message.id.value });
    }
    return Result.ok({ message: MessageMapper.toDto(message), isReplay: false });
  }

  /** Um reuso legitimo de Idempotency-Key deve repetir exatamente o mesmo pedido de envio. */
  private matchesReplayPayload(
    existing: Message,
    to: string,
    content: string,
    phoneNumberId: UniqueId,
  ): boolean {
    return (
      existing.to === to.trim() &&
      existing.content.body === content.trim() &&
      existing.phoneNumberId.value === phoneNumberId.value
    );
  }
}
