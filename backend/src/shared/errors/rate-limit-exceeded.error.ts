import { ApplicationError } from './base.error';

export class RateLimitExceededError extends ApplicationError {
  constructor(scope: string) {
    super('RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${scope}.`);
  }
}
