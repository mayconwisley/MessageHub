import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
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
import { Message } from '../../domain/entities/message.entity';
import { InvalidMessageError, TemplateNotFoundError } from '../../domain/errors';
import { SendTemplateMessageCommand } from '../commands/send-template-message.command';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { IMessagePublisher, MESSAGE_PUBLISHER } from '../ports/message-publisher.interface';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';

@CommandHandler(SendTemplateMessageCommand)
export class SendTemplateMessageHandler implements ICommandHandler<SendTemplateMessageCommand> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepository: ITemplateRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(
    command: SendTemplateMessageCommand,
  ): Promise<
    Result<
      MessageDto,
      | InvalidMessageError
      | ApplicationNotFoundError
      | PhoneNumberNotFoundError
      | TemplateNotFoundError
    >
  > {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) return Result.fail(new ApplicationNotFoundError(command.applicationId));
    if (command.requestingTenantId && application.tenantId.value !== command.requestingTenantId) {
      // Nunca revelar que a Application existe em outro tenant (secao 17).
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const phoneNumberId = UniqueId.create(command.phoneNumberId);
    const phoneNumber = await this.phoneNumberRepository.findById(phoneNumberId);
    if (!phoneNumber) return Result.fail(new PhoneNumberNotFoundError(command.phoneNumberId));
    const account = await this.whatsAppAccountRepository.findById(phoneNumber.whatsAppAccountId);
    if (!account || !account.tenantId.equals(application.tenantId)) {
      return Result.fail(new PhoneNumberNotFoundError(command.phoneNumberId));
    }

    if (command.idempotencyKey) {
      const existing = await this.messageRepository.findByIdempotencyKey(
        applicationId,
        command.idempotencyKey,
      );
      if (existing) return Result.ok(MessageMapper.toDto(existing));
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

    const messageResult = Message.createTemplate({
      tenantId: application.tenantId,
      applicationId,
      phoneNumberId,
      to: command.to,
      metaTemplateId: template.metaTemplateId,
      templateName: template.name,
      language: template.language,
      parameters: command.parameters.length
        ? [{ component: 'body', values: command.parameters }]
        : [],
      idempotencyKey: command.idempotencyKey,
    });
    if (messageResult.isFailure) return Result.fail(messageResult.error);
    const message = messageResult.value;
    await this.messageRepository.save(message);
    await this.messagePublisher.publishMessageRequested({ messageId: message.id.value });
    return Result.ok(MessageMapper.toDto(message));
  }
}
