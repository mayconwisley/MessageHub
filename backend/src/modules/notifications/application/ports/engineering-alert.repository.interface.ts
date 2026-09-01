import { SortDirection } from '@shared/types';

export type EngineeringAlertSeverity = 'WARNING' | 'CRITICAL';

/** Campos pelos quais a listagem de alertas de engenharia pode ser ordenada. */
export enum EngineeringAlertSortField {
  SEVERITY = 'severity',
  OCCURRED_AT = 'occurredAt',
}

export interface CreateEngineeringAlertInput {
  type: string;
  severity: EngineeringAlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface EngineeringAlertDto extends CreateEngineeringAlertInput {
  id: string;
  occurredAt: Date;
  dispatchedAt: Date | null;
}

export interface ListEngineeringAlertsFilter {
  severity?: EngineeringAlertSeverity;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: EngineeringAlertSortField;
  sortDirection?: SortDirection;
}

export interface IEngineeringAlertRepository {
  create(input: CreateEngineeringAlertInput): Promise<EngineeringAlertDto>;
  markDispatched(id: string): Promise<void>;
  list(
    page: number,
    pageSize: number,
    filter?: ListEngineeringAlertsFilter,
  ): Promise<import('@shared/types').PaginatedResult<EngineeringAlertDto>>;
}

export const ENGINEERING_ALERT_REPOSITORY = Symbol('ENGINEERING_ALERT_REPOSITORY');
