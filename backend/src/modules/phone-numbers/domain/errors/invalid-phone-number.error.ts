import { DomainError } from '@shared/errors';

export class InvalidPhoneNumberError extends DomainError {
  constructor(reason: string) {
    super('INVALID_PHONE_NUMBER', reason);
  }
}
