import { UniqueId } from '@shared/domain';
import { Tenant } from '../entities/tenant.entity';
import { PaginatedResult } from '@shared/types';
import { TenantStatus } from '../enums/tenant-status.enum';

export interface ListTenantsFilter {
  status?: TenantStatus;
  search?: string;
}

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: UniqueId): Promise<Tenant | null>;
  list(page: number, pageSize: number, filter?: ListTenantsFilter): Promise<PaginatedResult<Tenant>>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
