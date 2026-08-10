import { Result } from '@shared/result';
import { ProviderUnavailableError } from '../../domain/errors/provider-unavailable.error';

export interface OutgoingMessage {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  content: string;
}

export interface ProviderMessageResult {
  providerMessageId: string;
}

/** Abstracao do provedor de mensageria (secao 16) - o dominio nunca conhece Meta/Twilio/etc. */
export interface IMessageProvider {
  send(message: OutgoingMessage): Promise<Result<ProviderMessageResult, ProviderUnavailableError>>;
}

export const MESSAGE_PROVIDER = Symbol('MESSAGE_PROVIDER');
