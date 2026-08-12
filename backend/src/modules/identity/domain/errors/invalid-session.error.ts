import { AuthenticationError } from '@shared/errors';

export class InvalidSessionError extends AuthenticationError {
  constructor() {
    super('INVALID_SESSION', 'The session token is missing, invalid, expired or revoked.');
  }
}
