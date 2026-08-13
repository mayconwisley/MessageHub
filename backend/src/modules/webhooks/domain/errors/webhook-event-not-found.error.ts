import { BaseError } from '@shared/errors';

export class WebhookEventNotFoundError extends BaseError {
  constructor(id: string) {
    super(
      'WEBHOOK_EVENT_NOT_FOUND',
      `Evento de webhook ${id} não encontrado ou indisponível para reprocessamento.`,
    );
  }
}
