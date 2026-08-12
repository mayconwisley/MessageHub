import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PhoneNumberNotFoundError } from '../../domain/errors/phone-number-not-found.error';
import { PhoneNumberDto } from '../dto/phone-number.dto';

export class GetPhoneNumberQuery extends Query<Result<PhoneNumberDto, PhoneNumberNotFoundError>> {
  constructor(
    public readonly phoneNumberId: string,
    public readonly tenantId?: string,
  ) {
    super();
  }
}
