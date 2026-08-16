export interface EmailRequestedPayload {
  emailMessageId: string;
}
export interface IEmailPublisher {
  publishEmailRequested(payload: EmailRequestedPayload): Promise<void>;
  publishToDeadLetterQueue(payload: EmailRequestedPayload): Promise<void>;
}
export const EMAIL_PUBLISHER = Symbol('EMAIL_PUBLISHER');
