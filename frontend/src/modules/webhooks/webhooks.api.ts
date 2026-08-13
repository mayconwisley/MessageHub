import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface WebhookEvent {
  id: string;
  provider: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  payload: Record<string, unknown>;
  receivedAt: string;
  processedAt: string | null;
  failureReason: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
}

export const webhooksApi = {
  list: (params: { page: number; pageSize: number; status?: string }) =>
    request<PaginatedResult<WebhookEvent>>(`/v1/webhook-events${toQueryString(params)}`),
  reprocess: (id: string) =>
    request<WebhookEvent>(`/v1/webhook-events/${id}/reprocess`, { method: 'POST' }),
};
