import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { TenantDto } from '../dto/tenant.dto';
import { TenantMapper } from '../mappers/tenant.mapper';
import { ListTenantsQuery } from '../queries/list-tenants.query';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '../../domain/repositories/tenant.repository.interface';

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler implements IQueryHandler<ListTenantsQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository) {}
  async execute(query: ListTenantsQuery): Promise<Result<PaginatedResult<TenantDto>, BaseError>> {
    const result = await this.tenants.list(query.page, query.pageSize, {
      status: query.status,
      search: query.search,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return Result.ok({
      ...result,
      items: result.items.map((tenant) => TenantMapper.toDto(tenant)),
    });
  }
}
