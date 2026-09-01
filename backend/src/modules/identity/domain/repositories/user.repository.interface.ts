import { UniqueId } from '@shared/domain';
import { PaginatedResult, SortDirection } from '@shared/types';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

/** Campos pelos quais a listagem de usuários pode ser ordenada. */
export enum UserSortField {
  NAME = 'name',
  EMAIL = 'email',
  ROLE = 'role',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export interface ListUsersFilter {
  tenantId?: string;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: UserSortField;
  sortDirection?: SortDirection;
}

export interface IUserRepository {
  save(user: User): Promise<void>;
  count(): Promise<number>;
  findById(id: UniqueId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(page: number, pageSize: number, filter?: ListUsersFilter): Promise<PaginatedResult<User>>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
