import { ProviderError } from '@shared/errors';
export class EmailDeliveryRejectedError extends ProviderError {
  readonly retryable = false;
  constructor(message: string) {
    super('EMAIL_DELIVERY_REJECTED', message);
  }
}
