import { DomainError } from '@shared/errors';

export class PhoneNumberNotConfiguredError extends DomainError {
  constructor(applicationId: string) {
    super(
      'PHONE_NUMBER_NOT_CONFIGURED',
      `Aplicação ${applicationId} não possui número de telefone vinculado. Vincule um número via PUT /v1/applications/{id}/phone-numbers ou informe phoneNumberId explicitamente.`,
    );
  }
}
