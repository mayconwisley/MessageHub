import { DomainError } from '@shared/errors';

export class PhoneNumberTenantMismatchError extends DomainError {
  constructor(phoneNumberId: string) {
    super(
      'PHONE_NUMBER_TENANT_MISMATCH',
      `Número de telefone ${phoneNumberId} não pertence ao tenant da aplicação.`,
    );
  }
}
