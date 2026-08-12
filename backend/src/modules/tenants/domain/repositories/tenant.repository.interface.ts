import { UniqueId } from '@shared/domain';
import { Tenant } from '../entities/tenant.entity';
import { PaginatedResult } from '@shared/types';

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: UniqueId): Promise<Tenant | null>;
  list(page: number, pageSize: number): Promise<PaginatedResult<Tenant>>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
