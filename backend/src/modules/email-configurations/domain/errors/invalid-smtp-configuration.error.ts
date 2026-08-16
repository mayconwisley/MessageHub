import { DomainError } from '@shared/errors';

export class InvalidSmtpConfigurationError extends DomainError {
  constructor(reason: string) {
    super('INVALID_SMTP_CONFIGURATION', reason);
  }
}
