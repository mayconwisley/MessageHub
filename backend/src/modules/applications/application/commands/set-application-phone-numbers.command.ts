import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { PhoneNumberTenantMismatchError } from '../../domain/errors/phone-number-tenant-mismatch.error';
import { PhoneNumberNotFoundError } from '@modules/phone-numbers/domain/errors/phone-number-not-found.error';
import { LinkedPhoneNumberDto } from '../dto/linked-phone-number.dto';

export class SetApplicationPhoneNumbersCommand extends Command<
  Result<
    LinkedPhoneNumberDto[],
    ApplicationNotFoundError | PhoneNumberNotFoundError | PhoneNumberTenantMismatchError
  >
> {
  constructor(
    public readonly applicationId: string,
    public readonly phoneNumberIds: string[],
  ) {
    super();
  }
}
