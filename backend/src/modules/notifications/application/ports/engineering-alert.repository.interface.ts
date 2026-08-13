export type EngineeringAlertSeverity = 'WARNING' | 'CRITICAL';

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

export interface IEngineeringAlertRepository {
  create(input: CreateEngineeringAlertInput): Promise<EngineeringAlertDto>;
  markDispatched(id: string): Promise<void>;
}

export const ENGINEERING_ALERT_REPOSITORY = Symbol('ENGINEERING_ALERT_REPOSITORY');
