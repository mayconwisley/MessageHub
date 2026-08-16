import { ProviderError } from '@shared/errors';
export class SmtpProviderUnavailableError extends ProviderError {
  readonly retryable = true;
  constructor(message: string) {
    super('SMTP_PROVIDER_UNAVAILABLE', message);
  }
}
