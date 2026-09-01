import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { BaseError } from '@shared/errors';
import { ApplicationSortField } from '../../domain/repositories/application.repository.interface';
import { ApplicationDto } from '../dto/application.dto';
export class ListApplicationsQuery extends Query<
  Result<PaginatedResult<ApplicationDto>, BaseError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: ApplicationSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
