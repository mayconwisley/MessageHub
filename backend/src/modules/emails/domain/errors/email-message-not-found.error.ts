import { DomainError } from '@shared/errors';
export class EmailMessageNotFoundError extends DomainError {
  constructor() {
    super('EMAIL_MESSAGE_NOT_FOUND', 'E-mail não foi encontrado.');
  }
}
