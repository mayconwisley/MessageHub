import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { PhoneNumberStatus } from '../../domain/enums/phone-number-status.enum';
import { PhoneNumberDto } from '../dto/phone-number.dto';
export class ListPhoneNumbersQuery extends Query<Result<PaginatedResult<PhoneNumberDto>, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: PhoneNumberStatus,
  ) {
    super();
  }
}
