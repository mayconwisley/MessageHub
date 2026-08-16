import { DomainError } from '@shared/errors';
export class InvalidEmailMessageError extends DomainError {
  constructor(reason: string) {
    super('INVALID_EMAIL_MESSAGE', reason);
  }
}
