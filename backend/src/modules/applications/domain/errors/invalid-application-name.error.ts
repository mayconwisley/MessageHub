import { DomainError } from '@shared/errors';

export class InvalidApplicationNameError extends DomainError {
  constructor() {
    super('INVALID_APPLICATION_NAME', 'O nome da aplicação não deve estar vazio.');
  }
}
