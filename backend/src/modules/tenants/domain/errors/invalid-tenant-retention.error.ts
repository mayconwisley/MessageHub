import { DomainError } from '@shared/errors';

export class InvalidTenantRetentionError extends DomainError {
  constructor() {
    super(
      'INVALID_TENANT_RETENTION',
      'O prazo de retenção deve ser um número inteiro entre 1 e 3650 dias.',
    );
  }
}
