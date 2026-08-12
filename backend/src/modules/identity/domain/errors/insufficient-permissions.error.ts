import { AuthorizationError } from '@shared/errors';

export class InsufficientPermissionsError extends AuthorizationError {
  constructor() {
    super('INSUFFICIENT_PERMISSIONS', 'The authenticated user does not have permission for this resource.');
  }
}
