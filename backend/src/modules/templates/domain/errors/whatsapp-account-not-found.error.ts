import { DomainError } from '@shared/errors';

export class WhatsAppAccountNotFoundError extends DomainError {
  constructor() {
    super('WHATSAPP_ACCOUNT_NOT_FOUND', 'Conta do WhatsApp não foi encontrada.');
  }
}
