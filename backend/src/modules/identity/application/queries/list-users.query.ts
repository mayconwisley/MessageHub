import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { UserDto } from '../dto/user.dto';

export class ListUsersQuery extends Query<Result<PaginatedResult<UserDto>, BaseError>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly tenantId?: string,
    public readonly role?: UserRole,
    public readonly status?: UserStatus,
    public readonly search?: string,
  ) {
    super();
  }
}
