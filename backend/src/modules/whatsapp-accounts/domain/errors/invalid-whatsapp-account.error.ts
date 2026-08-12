import { DomainError } from '@shared/errors';

export class InvalidWhatsAppAccountError extends DomainError {
  constructor(reason: string) {
    super('INVALID_WHATSAPP_ACCOUNT', reason);
  }
}
