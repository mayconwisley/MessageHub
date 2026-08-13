import { Inject, Injectable } from '@nestjs/common';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { Application } from '@modules/applications/domain/entities/application.entity';
import {
  APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
  IApplicationPhoneNumberLinkRepository,
} from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { AmbiguousPhoneNumberError } from '../../domain/errors/ambiguous-phone-number.error';
import { PhoneNumberNotConfiguredError } from '../../domain/errors/phone-number-not-configured.error';

/**
 * Resolve o número de origem: usa o phoneNumberId explícito quando informado
 * (compatibilidade retroativa), ou o único número vinculado à aplicação via
 * PUT /v1/applications/{id}/phone-numbers (cadastro inicial), evitando repetir
 * phoneNumberId em toda requisição.
 */
@Injectable()
export class PhoneNumberResolverService {
  constructor(
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccounts: IWhatsAppAccountRepository,
    @Inject(APPLICATION_PHONE_NUMBER_LINK_REPOSITORY)
    private readonly links: IApplicationPhoneNumberLinkRepository,
  ) {}

  async resolve(
    application: Application,
    explicitPhoneNumberId: string | undefined,
  ): Promise<
    Result<
      PhoneNumber,
      PhoneNumberNotFoundError | PhoneNumberNotConfiguredError | AmbiguousPhoneNumberError
    >
  > {
    if (explicitPhoneNumberId) {
      return this.resolveExplicit(application, explicitPhoneNumberId);
    }

    const linkedIds = await this.links.listPhoneNumberIdsByApplication(application.id);
    if (linkedIds.length === 0) {
      return Result.fail(new PhoneNumberNotConfiguredError(application.id.value));
    }
    if (linkedIds.length > 1) {
      return Result.fail(new AmbiguousPhoneNumberError(application.id.value));
    }

    const phoneNumber = await this.phoneNumbers.findById(linkedIds[0]);
    if (!phoneNumber) {
      return Result.fail(new PhoneNumberNotFoundError(linkedIds[0].value));
    }
    return Result.ok(phoneNumber);
  }

  private async resolveExplicit(
    application: Application,
    phoneNumberId: string,
  ): Promise<Result<PhoneNumber, PhoneNumberNotFoundError>> {
    const phoneNumber = await this.phoneNumbers.findById(UniqueId.create(phoneNumberId));
    if (!phoneNumber) {
      return Result.fail(new PhoneNumberNotFoundError(phoneNumberId));
    }

    const account = await this.whatsAppAccounts.findById(phoneNumber.whatsAppAccountId);
    if (!account || !account.tenantId.equals(application.tenantId)) {
      // Nunca revelar que o PhoneNumber existe em outro tenant (secao 17).
      return Result.fail(new PhoneNumberNotFoundError(phoneNumberId));
    }

    return Result.ok(phoneNumber);
  }
}
