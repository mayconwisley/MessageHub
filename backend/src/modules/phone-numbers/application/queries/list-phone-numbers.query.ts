import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { BaseError } from '@shared/errors';
import { PhoneNumberStatus } from '../../domain/enums/phone-number-status.enum';
import { PhoneNumberSortField } from '../../domain/repositories/phone-number.repository.interface';
import { PhoneNumberDto } from '../dto/phone-number.dto';
export class ListPhoneNumbersQuery extends Query<
  Result<PaginatedResult<PhoneNumberDto>, BaseError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: PhoneNumberStatus,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: PhoneNumberSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
