import { UniqueId } from '@shared/domain';
import { Tenant } from '../entities/tenant.entity';
import { PaginatedResult, SortDirection } from '@shared/types';
import { TenantStatus } from '../enums/tenant-status.enum';

/** Campos pelos quais a listagem de tenants pode ser ordenada. */
export enum TenantSortField {
  NAME = 'name',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export interface ListTenantsFilter {
  status?: TenantStatus;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: TenantSortField;
  sortDirection?: SortDirection;
}

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: UniqueId): Promise<Tenant | null>;
  list(
    page: number,
    pageSize: number,
    filter?: ListTenantsFilter,
  ): Promise<PaginatedResult<Tenant>>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
