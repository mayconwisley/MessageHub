import { PaginatedResult } from '@shared/types';

export type SystemLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface SystemLogDto {
  id: string;
  occurredAt: Date;
  level: SystemLogLevel;
  context: string | null;
  message: string;
  requestId: string | null;
  metadata: Record<string, unknown>;
}

export interface SystemLogListFilters {
  level?: SystemLogLevel;
  search?: string;
}

export interface ISystemLogRepository {
  list(
    page: number,
    pageSize: number,
    filters?: SystemLogListFilters,
  ): Promise<PaginatedResult<SystemLogDto>>;
}

export const SYSTEM_LOG_REPOSITORY = Symbol('SYSTEM_LOG_REPOSITORY');
