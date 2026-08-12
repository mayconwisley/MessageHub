import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { LinkedPhoneNumberDto } from '../dto/linked-phone-number.dto';

export class ListApplicationPhoneNumbersQuery extends Query<
  Result<LinkedPhoneNumberDto[], ApplicationNotFoundError>
> {
  constructor(public readonly applicationId: string) {
    super();
  }
}
