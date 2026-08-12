export interface InboundMessageReceivedPayload {
  applicationId: string;
  phoneNumberId: string;
  message: Record<string, unknown>;
  receivedAt: string;
}

/** Publica notificacoes de mensagem recebida para o worker que entrega o webhook a cada Application vinculada ao numero. */
export interface IInboundMessageWebhookPublisher {
  publishInboundMessageReceived(payload: InboundMessageReceivedPayload): Promise<void>;
}

export const INBOUND_MESSAGE_WEBHOOK_PUBLISHER = Symbol('INBOUND_MESSAGE_WEBHOOK_PUBLISHER');
