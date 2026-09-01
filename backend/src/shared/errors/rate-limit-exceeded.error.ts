import { ApplicationError } from './base.error';

export class RateLimitExceededError extends ApplicationError {
  constructor(scope: string, retryAfterSeconds?: number) {
    const retrySuffix =
      retryAfterSeconds !== undefined ? ` Tente novamente em ${retryAfterSeconds} segundos.` : '';
    super('RATE_LIMIT_EXCEEDED', `Limite de requisições excedido para ${scope}.${retrySuffix}`);
  }
}
