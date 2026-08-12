import { DomainError } from '@shared/errors';

export class InvalidTenantNameError extends DomainError {
  constructor() {
    super('INVALID_TENANT_NAME', 'Tenant name must not be empty.');
  }
}
