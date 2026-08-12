import { AuthorizationError } from '@shared/errors';

export class InsufficientPermissionsError extends AuthorizationError {
  constructor() {
    super('INSUFFICIENT_PERMISSIONS', 'O usuário autenticado não tem permissão para este recurso.');
  }
}
