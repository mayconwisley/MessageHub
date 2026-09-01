import { ApplicationError } from '@shared/errors';

export class IdempotencyKeyConflictError extends ApplicationError {
  constructor(idempotencyKey: string) {
    super(
      'IDEMPOTENCY_KEY_CONFLICT',
      `A Idempotency-Key "${idempotencyKey}" já foi usada com dados diferentes de envio.`,
    );
  }
}
