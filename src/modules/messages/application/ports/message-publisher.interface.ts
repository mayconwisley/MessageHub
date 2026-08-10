export interface MessageRequestedPayload {
  messageId: string;
}

export interface IMessagePublisher {
  publishMessageRequested(payload: MessageRequestedPayload): Promise<void>;
}

export const MESSAGE_PUBLISHER = Symbol('MESSAGE_PUBLISHER');
