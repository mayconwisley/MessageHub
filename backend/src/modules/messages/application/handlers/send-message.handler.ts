import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { Message } from '../../domain/entities/message.entity';
import { InvalidMessageError } from '../../domain/errors/invalid-message.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import { SendMessageCommand } from '../commands/send-message.command';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { IMessagePublisher, MESSAGE_PUBLISHER } from '../ports/message-publisher.interface';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(MESSAGE_PUBLISHER) private readonly messagePublisher: IMessagePublisher,
  ) {}

  async execute(
    command: SendMessageCommand,
  ): Promise<
    Result<MessageDto, InvalidMessageError | ApplicationNotFoundError | PhoneNumberNotFoundError>
  > {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }
    if (
      command.requestingTenantId &&
      application.tenantId.value !== command.requestingTenantId
    ) {
      // Nunca revelar que a Application existe em outro tenant (secao 17).
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const phoneNumberId = UniqueId.create(command.phoneNumberId);
    const phoneNumber = await this.phoneNumberRepository.findById(phoneNumberId);
    if (!phoneNumber) {
      return Result.fail(new PhoneNumberNotFoundError(command.phoneNumberId));
    }

    const whatsAppAccount = await this.whatsAppAccountRepository.findById(
      phoneNumber.whatsAppAccountId,
    );
    if (!whatsAppAccount || !whatsAppAccount.tenantId.equals(application.tenantId)) {
      // Nunca revelar que o PhoneNumber existe em outro tenant (secao 17).
      return Result.fail(new PhoneNumberNotFoundError(command.phoneNumberId));
    }

    if (command.idempotencyKey) {
      const existing = await this.messageRepository.findByIdempotencyKey(
        applicationId,
        command.idempotencyKey,
      );
      if (existing) {
        return Result.ok(MessageMapper.toDto(existing));
      }
    }

    const messageResult = Message.create({
      tenantId: application.tenantId,
      applicationId,
      phoneNumberId,
      to: command.to,
      content: command.content,
      idempotencyKey: command.idempotencyKey,
    });
    if (messageResult.isFailure) {
      return Result.fail(messageResult.error);
    }

    const message = messageResult.value;
    await this.messageRepository.save(message);
    await this.messagePublisher.publishMessageRequested({ messageId: message.id.value });

    return Result.ok(MessageMapper.toDto(message));
  }
}
