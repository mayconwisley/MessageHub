import { ApplicationError } from './base.error';

export class RateLimitExceededError extends ApplicationError {
  constructor(scope: string) {
    super('RATE_LIMIT_EXCEEDED', `Limite de requisições excedido para ${scope}.`);
  }
}
