import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult, SortDirection } from '@shared/types';
import {
  EngineeringAlertDto,
  EngineeringAlertSeverity,
  EngineeringAlertSortField,
} from '../ports/engineering-alert.repository.interface';

export class ListEngineeringAlertsQuery extends Query<
  Result<PaginatedResult<EngineeringAlertDto>, BaseError>
> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly severity?: EngineeringAlertSeverity,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: EngineeringAlertSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
