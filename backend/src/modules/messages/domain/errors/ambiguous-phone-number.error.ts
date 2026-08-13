import { DomainError } from '@shared/errors';

export class AmbiguousPhoneNumberError extends DomainError {
  constructor(applicationId: string) {
    super(
      'AMBIGUOUS_PHONE_NUMBER',
      `Aplicação ${applicationId} possui múltiplos números de telefone vinculados. Informe phoneNumberId explicitamente.`,
    );
  }
}
