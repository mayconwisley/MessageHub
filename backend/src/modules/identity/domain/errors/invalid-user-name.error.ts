import { DomainError } from '@shared/errors';

export class InvalidUserNameError extends DomainError {
  constructor() {
    super('INVALID_USER_NAME', 'O nome do usuário não deve estar vazio.');
  }
}
