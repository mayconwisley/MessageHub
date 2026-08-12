import { DomainError } from '@shared/errors';

export class InvalidMessageError extends DomainError {
  constructor(reason: string) {
    super('INVALID_MESSAGE', reason);
  }
}
