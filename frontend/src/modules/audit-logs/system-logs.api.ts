import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export type SystemLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface SystemLog {
  id: string;
  occurredAt: string;
  level: SystemLogLevel;
  context: string | null;
  message: string;
  requestId: string | null;
  metadata: Record<string, unknown>;
}

export const systemLogsApi = {
  list: (params: { page: number; pageSize: number; level?: string; search?: string }) =>
    request<PaginatedResult<SystemLog>>(`/v1/system-logs${toQueryString(params)}`),
};
