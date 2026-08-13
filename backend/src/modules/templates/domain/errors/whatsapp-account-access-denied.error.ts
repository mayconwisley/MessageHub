import { DomainError } from '@shared/errors';

export class WhatsAppAccountAccessDeniedError extends DomainError {
  constructor() {
    super(
      'WHATSAPP_ACCOUNT_ACCESS_DENIED',
      'A conta do WhatsApp não pertence ao tenant autenticado.',
    );
  }
}
