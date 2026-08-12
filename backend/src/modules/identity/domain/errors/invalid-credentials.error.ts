import { AuthenticationError } from '@shared/errors';

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password.');
  }
}
