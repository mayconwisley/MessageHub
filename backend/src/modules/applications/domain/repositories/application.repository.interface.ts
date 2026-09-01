import { UniqueId } from '@shared/domain';
import { Application } from '../entities/application.entity';
import { PaginatedResult, SortDirection } from '@shared/types';

/** Campos pelos quais a listagem de aplicações pode ser ordenada. */
export enum ApplicationSortField {
  NAME = 'name',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export interface ListApplicationsFilter {
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: ApplicationSortField;
  sortDirection?: SortDirection;
}

export interface IApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: UniqueId): Promise<Application | null>;
  listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListApplicationsFilter,
  ): Promise<PaginatedResult<Application>>;
}

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');
