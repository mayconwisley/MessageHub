import { PaginatedResult } from '@shared/types';

export interface AuditLogDto {
  id: string;
  occurredAt: Date;
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

export interface AuditLogListFilters {
  resourceType?: string;
  httpMethod?: string;
}

export interface IAuditLogRepository {
  list(
    page: number,
    pageSize: number,
    filters?: AuditLogListFilters,
  ): Promise<PaginatedResult<AuditLogDto>>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
