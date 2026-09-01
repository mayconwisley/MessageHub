import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import { TemplateStatus } from '@modules/templates/domain/enums/template-status.enum';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '@modules/templates/domain/repositories/template.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { RateLimitExceededError } from '@shared/errors';
import { Message } from '../../domain/entities/message.entity';
import {
  AmbiguousPhoneNumberError,
  IdempotencyKeyConflictError,
  InvalidMessageError,
  PhoneNumberNotConfiguredError,
  TemplateNotFoundError,
} from '../../domain/errors';
import { TemplateParameterGroup } from '../../domain/value-objects/template-message.value-object';
import { SendTemplateMessageCommand } from '../commands/send-template-message.command';
import { SendMessageResultDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { IMessagePublisher, MESSAGE_PUBLISHER } from '../ports/message-publisher.interface';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
} from '../ports/message-timeline.repository.interface';
import { PhoneNumberResolverService } from '../services/phone-number-resolver.service';
import { OutboxEventType } from '@shared/outbox';

@CommandHandler(SendTemplateMessageCommand)
export class SendTemplateMessageHandler implements ICommandHandler<SendTemplateMessageCommand> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    private readonly phoneNumberResolver: PhoneNumberResolverService,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepository: ITemplateRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
    @Inject(MESSAGE_TIMELINE_REPOSITORY) private readonly timeline?: IMessageTimelineRepository,
  ) {}

  async execute(
    command: SendTemplateMessageCommand,
  ): Promise<
    Result<
      SendMessageResultDto,
      | InvalidMessageError
      | ApplicationNotFoundError
      | PhoneNumberNotFoundError
      | PhoneNumberNotConfiguredError
      | AmbiguousPhoneNumberError
      | TemplateNotFoundError
      | RateLimitExceededError
      | IdempotencyKeyConflictError
    >
  > {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) return Result.fail(new ApplicationNotFoundError(command.applicationId));
    if (command.requestingTenantId && application.tenantId.value !== command.requestingTenantId) {
      // Nunca revelar que a Application existe em outro tenant (secao 17).
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const phoneNumberResult = await this.phoneNumberResolver.resolve(
      application,
      command.phoneNumberId,
    );
    if (phoneNumberResult.isFailure) return Result.fail(phoneNumberResult.error);
    const phoneNumber = phoneNumberResult.value;
    const phoneNumberId = phoneNumber.id;
    const account = await this.whatsAppAccountRepository.findById(phoneNumber.whatsAppAccountId);
    if (!account) {
      return Result.fail(new PhoneNumberNotFoundError(phoneNumber.id.value));
    }

    const reference = command.template.id ?? command.template.name ?? 'unknown';
    const templates = command.template.id
      ? [
          await this.templateRepository.findByMetaId(
            application.tenantId,
            account.id,
            command.template.id,
          ),
        ]
      : command.template.name
        ? await this.templateRepository.findByName(
            application.tenantId,
            account.id,
            command.template.name,
          )
        : [];
    const approvedTemplates = templates.filter(
      (template): template is NonNullable<typeof template> =>
        template?.status === TemplateStatus.APPROVED,
    );
    const template = approvedTemplates.length === 1 ? approvedTemplates[0] : null;
    if (!template || template.status !== TemplateStatus.APPROVED) {
      return Result.fail(new TemplateNotFoundError(reference));
    }

    const parameters: TemplateParameterGroup[] = command.parameters.length
      ? [{ component: 'body', values: command.parameters }]
      : [];

    if (command.idempotencyKey) {
      const existing = await this.messageRepository.findByIdempotencyKey(
        applicationId,
        command.idempotencyKey,
      );
      if (existing) {
        if (
          !this.matchesReplayPayload(existing, command.to, phoneNumberId, template.name, parameters)
        ) {
          return Result.fail(new IdempotencyKeyConflictError(command.idempotencyKey));
        }
        return Result.ok({ message: MessageMapper.toDto(existing), isReplay: true });
      }
    }

    const messageResult = Message.createTemplate({
      tenantId: application.tenantId,
      applicationId,
      phoneNumberId,
      to: command.to,
      metaTemplateId: template.metaTemplateId,
      templateName: template.name,
      language: template.language,
      parameters,
      idempotencyKey: command.idempotencyKey,
      requestId: command.requestId,
    });
    if (messageResult.isFailure) return Result.fail(messageResult.error);
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
        !this.matchesReplayPayload(
          saveResult.existing,
          command.to,
          phoneNumberId,
          template.name,
          parameters,
        )
      ) {
        return Result.fail(new IdempotencyKeyConflictError(command.idempotencyKey));
      }
      return Result.ok({ message: MessageMapper.toDto(saveResult.existing), isReplay: true });
    }
    await this.timeline?.record({
      messageId: message.id.value,
      eventType: 'TEMPLATE_MESSAGE_ACCEPTED',
      status: message.status,
      source: 'API',
      metadata: { requestId: message.requestId, idempotencyKey: message.idempotencyKey },
    });
    if (!saveResult.outboxPersisted) {
      await this.messagePublisher.publishMessageRequested({ messageId: message.id.value });
    }
    return Result.ok({ message: MessageMapper.toDto(message), isReplay: false });
  }

  /** Um reuso legitimo de Idempotency-Key deve repetir exatamente o mesmo template e parametros. */
  private matchesReplayPayload(
    existing: Message,
    to: string,
    phoneNumberId: UniqueId,
    templateName: string,
    parameters: TemplateParameterGroup[],
  ): boolean {
    return (
      existing.to === to.trim() &&
      existing.phoneNumberId.value === phoneNumberId.value &&
      existing.template?.name === templateName &&
      JSON.stringify(existing.template?.parameters ?? []) === JSON.stringify(parameters)
    );
  }
}
