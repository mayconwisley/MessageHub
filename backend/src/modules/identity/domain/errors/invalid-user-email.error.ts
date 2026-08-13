import { DomainError } from '@shared/errors';

export class InvalidUserEmailError extends DomainError {
  constructor() {
    super('INVALID_USER_EMAIL', 'O e-mail do usuário não deve estar vazio.');
  }
}
