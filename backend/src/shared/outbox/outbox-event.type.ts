export enum OutboxEventType {
  MESSAGE_REQUESTED = 'MESSAGE_REQUESTED',
  EMAIL_REQUESTED = 'EMAIL_REQUESTED',
  META_WEBHOOK_RECEIVED = 'META_WEBHOOK_RECEIVED',
  INBOUND_MESSAGE_WEBHOOK = 'INBOUND_MESSAGE_WEBHOOK',
  MESSAGE_STATUS_CHANGED = 'MESSAGE_STATUS_CHANGED',
  MESSAGE_REQUESTED_DLQ = 'MESSAGE_REQUESTED_DLQ',
  EMAIL_REQUESTED_DLQ = 'EMAIL_REQUESTED_DLQ',
}

export interface NewOutboxEvent {
  eventType: OutboxEventType;
  aggregateType: string;
  aggregateId: string;
  tenantId?: string | null;
  payload: Record<string, unknown>;
  availableAt?: Date;
}
