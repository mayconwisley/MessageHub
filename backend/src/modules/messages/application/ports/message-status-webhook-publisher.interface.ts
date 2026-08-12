export interface MessageStatusChangedPayload {
  applicationId: string;
  messageId: string;
  status: string;
  occurredAt: string;
}

/** Publica notificacoes de mudanca de status para o worker que entrega o webhook de saida do tenant. */
export interface IMessageStatusWebhookPublisher {
  publishMessageStatusChanged(payload: MessageStatusChangedPayload): Promise<void>;
}

export const MESSAGE_STATUS_WEBHOOK_PUBLISHER = Symbol('MESSAGE_STATUS_WEBHOOK_PUBLISHER');
