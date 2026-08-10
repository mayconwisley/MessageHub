import { DomainError } from '@shared/errors';

export class InvalidApplicationNameError extends DomainError {
  constructor() {
    super('INVALID_APPLICATION_NAME', 'Application name must not be empty.');
  }
}
