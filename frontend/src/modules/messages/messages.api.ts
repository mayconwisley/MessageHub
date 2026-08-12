import { request, toQueryString } from '../../services/http-client';
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
  [key: string]: unknown;
}

export interface MessageAttempt {
  id: string;
  attemptNumber: number;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: string;
}

export const messagesApi = {
  send: (data: { applicationId: string; phoneNumberId: string; to: string; content: string }) =>
    request<Message>('/v1/messages', { method: 'POST', body: data, headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  get: (id: string, applicationId: string) =>
    request<Message>(`/v1/messages/${id}${toQueryString({ applicationId })}`),
  list: (params: { applicationId: string; page: number; pageSize: number; status?: string }) =>
    request<PaginatedResult<Message>>(`/v1/messages${toQueryString(params)}`),
  listAttempts: (id: string, applicationId: string) =>
    request<MessageAttempt[]>(`/v1/messages/${id}/attempts${toQueryString({ applicationId })}`),
};
