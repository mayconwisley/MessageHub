import { DomainError } from '@shared/errors';

/** Falha permanente causada pelo proprio requisitante (numero invalido, template incompativel, etc). Nunca deve ser reenviada automaticamente. */
export class MessageDeliveryRejectedError extends DomainError {
  readonly retryable = false;

  constructor(reason: string) {
    super('MESSAGE_DELIVERY_REJECTED', reason);
  }
}
