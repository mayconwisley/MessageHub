import { PaginatedResult, SortDirection } from '@shared/types';

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

/** Campos pelos quais a listagem de logs técnicos pode ser ordenada. */
export enum SystemLogSortField {
  LEVEL = 'level',
  OCCURRED_AT = 'occurredAt',
}

export interface SystemLogListFilters {
  level?: SystemLogLevel;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: SystemLogSortField;
  sortDirection?: SortDirection;
}

export interface ISystemLogRepository {
  list(
    page: number,
    pageSize: number,
    filters?: SystemLogListFilters,
  ): Promise<PaginatedResult<SystemLogDto>>;
}

export const SYSTEM_LOG_REPOSITORY = Symbol('SYSTEM_LOG_REPOSITORY');
