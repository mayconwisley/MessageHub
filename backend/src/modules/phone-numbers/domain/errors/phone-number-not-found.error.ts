import { DomainError } from '@shared/errors';

export class PhoneNumberNotFoundError extends DomainError {
  constructor(phoneNumberId: string) {
    super('PHONE_NUMBER_NOT_FOUND', `Phone number ${phoneNumberId} not found.`);
  }
}
