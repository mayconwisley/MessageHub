import { Inject, Injectable } from '@nestjs/common';
import {
  CreateEngineeringAlertInput,
  ENGINEERING_ALERT_REPOSITORY,
  IEngineeringAlertRepository,
} from '../ports/engineering-alert.repository.interface';
import {
  ENGINEERING_ALERT_DISPATCHER,
  IEngineeringAlertDispatcher,
} from '../ports/engineering-alert-dispatcher.interface';

/** Persiste antes de entregar; payload externo nunca inclui conteúdo, tokens ou chaves. */
@Injectable()
export class EngineeringAlertService {
  constructor(
    @Inject(ENGINEERING_ALERT_REPOSITORY) private readonly alerts: IEngineeringAlertRepository,
    @Inject(ENGINEERING_ALERT_DISPATCHER) private readonly dispatcher: IEngineeringAlertDispatcher,
  ) {}
  async notify(input: CreateEngineeringAlertInput): Promise<void> {
    const alert = await this.alerts.create(input);
    if (await this.dispatcher.dispatch(alert)) await this.alerts.markDispatched(alert.id);
  }
}
