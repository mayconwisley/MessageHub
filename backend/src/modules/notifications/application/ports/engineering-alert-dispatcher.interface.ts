import { EngineeringAlertDto } from './engineering-alert.repository.interface';

/** Porta de saída para canais externos de alerta de engenharia. */
export interface IEngineeringAlertDispatcher {
  dispatch(alert: EngineeringAlertDto): Promise<boolean>;
}

export const ENGINEERING_ALERT_DISPATCHER = Symbol('ENGINEERING_ALERT_DISPATCHER');
