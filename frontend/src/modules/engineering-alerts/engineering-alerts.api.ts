import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface EngineeringAlert {
  id: string; type: string; severity: 'WARNING' | 'CRITICAL'; title: string; message: string; metadata: Record<string, unknown>; occurredAt: string; dispatchedAt: string | null;
}

export const engineeringAlertsApi = {
  list: (params: { page: number; pageSize: number; severity?: string }) => request<PaginatedResult<EngineeringAlert>>(`/v1/engineering-alerts${toQueryString(params)}`),
};
