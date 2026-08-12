import { ProviderError } from '@shared/errors';

export class ProviderUnavailableError extends ProviderError {
  constructor(reason: string) {
    super('PROVIDER_UNAVAILABLE', reason);
  }
}
