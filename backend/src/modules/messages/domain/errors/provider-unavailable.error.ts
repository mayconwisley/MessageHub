import { ProviderError } from '@shared/errors';

/** Indisponibilidade transitoria (rede, timeout, erro desconhecido do provedor) - seguro reenviar. */
export class ProviderUnavailableError extends ProviderError {
  readonly retryable = true;

  constructor(reason: string) {
    super('PROVIDER_UNAVAILABLE', reason);
  }
}
