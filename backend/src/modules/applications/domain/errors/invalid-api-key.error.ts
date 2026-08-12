import { AuthenticationError } from '@shared/errors';

export class InvalidApiKeyError extends AuthenticationError {
  constructor() {
    super('INVALID_API_KEY', 'A chave de API informada é inválida, revogada ou expirada.');
  }
}
