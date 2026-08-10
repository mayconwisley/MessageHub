import { UniqueId } from '@shared/domain';
import { Tenant } from '../entities/tenant.entity';

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
  findById(id: UniqueId): Promise<Tenant | null>;
}

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
