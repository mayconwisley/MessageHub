import { AuthenticationError } from '@shared/errors';

export class InvalidSessionError extends AuthenticationError {
  constructor() {
    super('INVALID_SESSION', 'O token de sessão está ausente, inválido, expirado ou revogado.');
  }
}
