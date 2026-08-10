import { AuthenticationError } from '@shared/errors';

export class InvalidApiKeyError extends AuthenticationError {
  constructor() {
    super('INVALID_API_KEY', 'The provided API key is invalid, revoked or expired.');
  }
}
