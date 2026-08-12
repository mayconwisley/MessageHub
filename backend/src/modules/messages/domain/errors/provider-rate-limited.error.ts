import { ProviderError } from '@shared/errors';

/** Limite de taxa reportado pelo provedor (Meta) - retentavel, porem deve ser sinalizado como 429. */
export class ProviderRateLimitedError extends ProviderError {
  readonly retryable = true;

  constructor(reason: string) {
    super('PROVIDER_RATE_LIMITED', reason);
  }
}
