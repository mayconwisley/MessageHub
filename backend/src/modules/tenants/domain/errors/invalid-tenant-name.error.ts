import { DomainError } from '@shared/errors';

export class InvalidTenantNameError extends DomainError {
  constructor() {
    super('INVALID_TENANT_NAME', 'O nome do tenant não deve estar vazio.');
  }
}
