export interface RecordEmailTimelineEventInput {
  emailMessageId: string;
  eventType: string;
  status: string;
  source: 'API' | 'WORKER' | 'OPERATOR';
  attemptNumber?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EmailTimelineEventDto extends RecordEmailTimelineEventInput {
  id: string;
  occurredAt: Date;
}

export interface IEmailTimelineRepository {
  record(input: RecordEmailTimelineEventInput): Promise<void>;
  listByEmailMessageId(emailMessageId: string): Promise<EmailTimelineEventDto[]>;
}

export const EMAIL_TIMELINE_REPOSITORY = Symbol('EMAIL_TIMELINE_REPOSITORY');
