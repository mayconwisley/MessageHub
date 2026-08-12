import { MessageDeliveryRejectedError } from './message-delivery-rejected.error';
import { ProviderRateLimitedError } from './provider-rate-limited.error';
import { ProviderUnavailableError } from './provider-unavailable.error';

/** Uniao dos erros tipados que qualquer chamada a Graph API (mensagens ou templates) pode produzir. */
export type MetaProviderError =
  | ProviderUnavailableError
  | MessageDeliveryRejectedError
  | ProviderRateLimitedError;
