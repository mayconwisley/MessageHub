import { Result } from '@shared/result';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { MetaProviderError } from '../../domain/errors/meta-provider-error.type';
import { TemplateMessage } from '../../domain/value-objects/template-message.value-object';

export type MessageDeliveryError = MetaProviderError;

export interface OutgoingMessage {
  phoneNumberId: string;
  credentialSource: WhatsAppCredentialSource;
  accessToken: string | null;
  to: string;
  content: string;
  template: TemplateMessage | null;
}

export interface ProviderMessageResult {
  providerMessageId: string;
}

/** Abstracao do provedor de mensageria (secao 16) - o dominio nunca conhece Meta/Twilio/etc. */
export interface IMessageProvider {
  send(message: OutgoingMessage): Promise<Result<ProviderMessageResult, MessageDeliveryError>>;
}

export const MESSAGE_PROVIDER = Symbol('MESSAGE_PROVIDER');
