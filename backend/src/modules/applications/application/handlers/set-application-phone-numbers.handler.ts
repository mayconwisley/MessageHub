import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors/phone-number-not-found.error';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { PhoneNumberTenantMismatchError } from '../../domain/errors/phone-number-tenant-mismatch.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import {
  APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
  IApplicationPhoneNumberLinkRepository,
} from '../../domain/repositories/application-phone-number-link.repository.interface';
import { SetApplicationPhoneNumbersCommand } from '../commands/set-application-phone-numbers.command';
import { LinkedPhoneNumberDto } from '../dto/linked-phone-number.dto';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';

@CommandHandler(SetApplicationPhoneNumbersCommand)
export class SetApplicationPhoneNumbersHandler implements ICommandHandler<SetApplicationPhoneNumbersCommand> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccounts: IWhatsAppAccountRepository,
    @Inject(APPLICATION_PHONE_NUMBER_LINK_REPOSITORY)
    private readonly links: IApplicationPhoneNumberLinkRepository,
  ) {}

  async execute(
    command: SetApplicationPhoneNumbersCommand,
  ): Promise<
    Result<
      LinkedPhoneNumberDto[],
      ApplicationNotFoundError | PhoneNumberNotFoundError | PhoneNumberTenantMismatchError
    >
  > {
    const application = await this.applications.findById(UniqueId.create(command.applicationId));
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const uniquePhoneNumberIds = [...new Set(command.phoneNumberIds)];
    const resolvedPhoneNumbers: PhoneNumber[] = [];
    for (const phoneNumberId of uniquePhoneNumberIds) {
      const phoneNumber = await this.phoneNumbers.findById(UniqueId.create(phoneNumberId));
      if (!phoneNumber) {
        return Result.fail(new PhoneNumberNotFoundError(phoneNumberId));
      }
      const account = await this.whatsAppAccounts.findById(phoneNumber.whatsAppAccountId);
      if (!account || !account.tenantId.equals(application.tenantId)) {
        return Result.fail(new PhoneNumberTenantMismatchError(phoneNumberId));
      }
      resolvedPhoneNumbers.push(phoneNumber);
    }

    await this.links.replaceForApplication(
      application.id,
      resolvedPhoneNumbers.map((phoneNumber) => phoneNumber.id),
    );

    return Result.ok(
      resolvedPhoneNumbers.map((phoneNumber) => ({
        id: phoneNumber.id.value,
        phoneNumberId: phoneNumber.phoneNumberId,
        displayNumber: phoneNumber.displayNumber,
      })),
    );
  }
}
