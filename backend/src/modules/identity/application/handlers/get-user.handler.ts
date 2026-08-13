import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { GetUserQuery } from '../queries/get-user.query';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<Result<UserDto, UserNotFoundError>> {
    const user = await this.users.findById(UniqueId.create(query.userId));
    if (!user) {
      return Result.fail(new UserNotFoundError(query.userId));
    }

    const tenant = user.tenantId ? await this.tenants.findById(UniqueId.create(user.tenantId)) : null;
    return Result.ok(UserMapper.toDto(user, tenant?.name ?? null));
  }
}
