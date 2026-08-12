import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { TenantDto } from '../dto/tenant.dto';

export class ListTenantsQuery extends Query<Result<PaginatedResult<TenantDto>>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
  ) {
    super();
  }
}
