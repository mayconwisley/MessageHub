import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { ListUsersQuery } from '../queries/list-users.query';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(query: ListUsersQuery): Promise<Result<PaginatedResult<UserDto>, BaseError>> {
    const result = await this.users.list(query.page, query.pageSize, {
      tenantId: query.tenantId,
      role: query.role,
      status: query.status,
      search: query.search,
    });
    return Result.ok({
      ...result,
      items: result.items.map((user) => UserMapper.toDto(user)),
    });
  }
}
