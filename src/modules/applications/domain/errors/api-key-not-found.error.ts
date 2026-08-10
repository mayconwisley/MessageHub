import { DomainError } from '@shared/errors';

export class ApiKeyNotFoundError extends DomainError {
  constructor(apiKeyId: string) {
    super('API_KEY_NOT_FOUND', `Api key ${apiKeyId} not found.`);
  }
}
