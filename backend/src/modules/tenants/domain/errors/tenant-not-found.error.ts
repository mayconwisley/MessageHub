import { DomainError } from '@shared/errors';

export class TenantNotFoundError extends DomainError {
  constructor(tenantId: string) {
    super('TENANT_NOT_FOUND', `Tenant ${tenantId} not found.`);
  }
}
