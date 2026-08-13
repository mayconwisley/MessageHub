export interface RecordMessageTimelineEventInput {
  messageId: string;
  eventType: string;
  status: string;
  source: 'API' | 'WORKER' | 'META_WEBHOOK' | 'OPERATOR' | 'SANDBOX';
  attemptNumber?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

export interface MessageTimelineEventDto extends RecordMessageTimelineEventInput {
  id: string;
  occurredAt: Date;
}

export interface IMessageTimelineRepository {
  record(input: RecordMessageTimelineEventInput): Promise<void>;
  listByMessageId(messageId: string): Promise<MessageTimelineEventDto[]>;
}

export const MESSAGE_TIMELINE_REPOSITORY = Symbol('MESSAGE_TIMELINE_REPOSITORY');
