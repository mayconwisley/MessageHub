import { ApplicationError } from '@shared/errors';

export class EmailAlreadyInUseError extends ApplicationError {
  constructor(email: string) {
    super('EMAIL_ALREADY_IN_USE', `O e-mail ${email} já está em uso por outro usuário.`);
  }
}
