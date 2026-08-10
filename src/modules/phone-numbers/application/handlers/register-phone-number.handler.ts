import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { WhatsAppAccountNotFoundError } from '@modules/whatsapp-accounts/domain/errors';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { PhoneNumber } from '../../domain/entities/phone-number.entity';
import { InvalidPhoneNumberError } from '../../domain/errors/invalid-phone-number.error';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '../../domain/repositories/phone-number.repository.interface';
import { RegisterPhoneNumberCommand } from '../commands/register-phone-number.command';
import { PhoneNumberDto } from '../dto/phone-number.dto';
import { PhoneNumberMapper } from '../mappers/phone-number.mapper';

@CommandHandler(RegisterPhoneNumberCommand)
export class RegisterPhoneNumberHandler implements ICommandHandler<RegisterPhoneNumberCommand> {
  constructor(
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
  ) {}

  async execute(
    command: RegisterPhoneNumberCommand,
  ): Promise<Result<PhoneNumberDto, InvalidPhoneNumberError | WhatsAppAccountNotFoundError>> {
    const whatsAppAccountId = UniqueId.create(command.whatsAppAccountId);
    const whatsAppAccount = await this.whatsAppAccountRepository.findById(whatsAppAccountId);
    if (!whatsAppAccount) {
      return Result.fail(new WhatsAppAccountNotFoundError(command.whatsAppAccountId));
    }

    const phoneNumberResult = PhoneNumber.create({
      whatsAppAccountId,
      phoneNumberId: command.phoneNumberId,
      displayNumber: command.displayNumber,
    });
    if (phoneNumberResult.isFailure) {
      return Result.fail(phoneNumberResult.error);
    }

    const phoneNumber = phoneNumberResult.value;
    await this.phoneNumberRepository.save(phoneNumber);

    return Result.ok(PhoneNumberMapper.toDto(phoneNumber));
  }
}
