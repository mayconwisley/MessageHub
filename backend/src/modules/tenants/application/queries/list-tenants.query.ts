import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantDto } from '../dto/tenant.dto';

export class ListTenantsQuery extends Query<Result<PaginatedResult<TenantDto>, BaseError>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: TenantStatus,
    public readonly search?: string,
  ) {
    super();
  }
}
