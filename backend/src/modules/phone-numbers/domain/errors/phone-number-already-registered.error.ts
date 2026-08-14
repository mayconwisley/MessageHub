import { ApplicationError } from '@shared/errors';

export class PhoneNumberAlreadyRegisteredError extends ApplicationError {
  constructor(phoneNumberId: string) {
    super(
      'PHONE_NUMBER_ALREADY_REGISTERED',
      `O número com ID ${phoneNumberId} já está registrado em outra conta.`,
    );
  }
}
