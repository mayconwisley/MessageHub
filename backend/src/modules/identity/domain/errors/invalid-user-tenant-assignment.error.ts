import { DomainError } from '@shared/errors';

export class InvalidUserTenantAssignmentError extends DomainError {
  constructor() {
    super(
      'INVALID_USER_TENANT_ASSIGNMENT',
      'tenantId é obrigatório para usuários que não são platform_admin.',
    );
  }
}
