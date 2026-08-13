import { AuthorizationError } from '@shared/errors';

export class InvalidWebhookSignatureError extends AuthorizationError {
  constructor() {
    super('INVALID_WEBHOOK_SIGNATURE', 'Assinatura do webhook inválida.');
  }
}
