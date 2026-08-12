import { DomainError } from '@shared/errors';

export class WhatsAppAccountNotFoundError extends DomainError {
  constructor(whatsAppAccountId: string) {
    super('WHATSAPP_ACCOUNT_NOT_FOUND', `WhatsApp account ${whatsAppAccountId} not found.`);
  }
}
