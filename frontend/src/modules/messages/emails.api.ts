import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult, SortDirection } from '../../services/pagination';

export interface EmailMessage {
  id: string;
  tenantId: string;
  applicationId: string;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  status: string;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTimelineEvent {
  id: string;
  eventType: string;
  status: string;
  source: 'API' | 'WORKER' | 'OPERATOR';
  attemptNumber?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export const emailsApi = {
  send: (data: { applicationId: string; to: string; subject: string; textBody: string }) =>
    request<EmailMessage>('/v1/emails', {
      method: 'POST',
      body: data,
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
  list: (params: {
    applicationId: string;
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: SortDirection;
  }) => request<PaginatedResult<EmailMessage>>(`/v1/emails${toQueryString(params)}`),
  listTimeline: (id: string, applicationId: string) =>
    request<EmailTimelineEvent[]>(`/v1/emails/${id}/timeline${toQueryString({ applicationId })}`),
};
