import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { ListUsersQuery } from '../queries/list-users.query';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<Result<PaginatedResult<UserDto>, BaseError>> {
    const result = await this.users.list(query.page, query.pageSize, {
      tenantId: query.tenantId,
      role: query.role,
      status: query.status,
      search: query.search,
    });

    const tenantIds = [
      ...new Set(result.items.map((user) => user.tenantId).filter(Boolean)),
    ] as string[];
    const tenants = await Promise.all(
      tenantIds.map((tenantId) => this.tenants.findById(UniqueId.create(tenantId))),
    );
    const tenantNamesById = new Map(
      tenants.filter((tenant) => tenant !== null).map((tenant) => [tenant.id.value, tenant.name]),
    );

    return Result.ok({
      ...result,
      items: result.items.map((user) =>
        UserMapper.toDto(user, user.tenantId ? (tenantNamesById.get(user.tenantId) ?? null) : null),
      ),
    });
  }
}
