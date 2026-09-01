import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { BaseError } from '@shared/errors';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantSortField } from '../../domain/repositories/tenant.repository.interface';
import { TenantDto } from '../dto/tenant.dto';

export class ListTenantsQuery extends Query<Result<PaginatedResult<TenantDto>, BaseError>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: TenantStatus,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: TenantSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
