import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface AuditLog {
  id: string;
  occurredAt: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  tenantId: string | null;
  requestId: string | null;
  httpMethod: string;
  httpPath: string;
  httpStatus: number;
  metadata: Record<string, unknown>;
}

export const auditLogsApi = {
  list: (params: { page: number; pageSize: number; resourceType?: string; httpMethod?: string }) =>
    request<PaginatedResult<AuditLog>>(`/v1/audit-logs${toQueryString(params)}`),
};
