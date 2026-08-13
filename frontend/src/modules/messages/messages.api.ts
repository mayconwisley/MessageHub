import { request, requestHealth, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface Message {
  id: string;
  to: string;
  content: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  lastError?: { code: string; message: string; occurredAt: string } | null;
  [key: string]: unknown;
}

export interface HealthCheck {
  status: 'ok' | 'error';
  details: {
    rabbitmq?: { status: 'up' | 'down'; message?: string };
  };
}

export interface MessageAttempt {
  id: string;
  attemptNumber: number;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: string;
}

export interface MessageTimelineEvent {
  id: string;
  eventType: string;
  status: string;
  source: 'API' | 'WORKER' | 'META_WEBHOOK' | 'OPERATOR';
  attemptNumber: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export const messagesApi = {
  send: (data: {
    applicationId: string;
    phoneNumberId?: string;
    to: string;
    content: string;
  }) =>
    request<Message>('/v1/messages', {
      method: 'POST',
      body: data,
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
  get: (id: string, applicationId: string) =>
    request<Message>(`/v1/messages/${id}${toQueryString({ applicationId })}`),
  list: (params: {
    applicationId: string;
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }) => request<PaginatedResult<Message>>(`/v1/messages${toQueryString(params)}`),
  listAttempts: (id: string, applicationId: string) =>
    request<MessageAttempt[]>(`/v1/messages/${id}/attempts${toQueryString({ applicationId })}`),
  listTimeline: (id: string, applicationId: string) =>
    request<MessageTimelineEvent[]>(
      `/v1/messages/${id}/timeline${toQueryString({ applicationId })}`,
    ),
  health: () => requestHealth<HealthCheck>('/health'),
};
