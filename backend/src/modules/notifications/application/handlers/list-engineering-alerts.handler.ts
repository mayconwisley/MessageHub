import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@shared/types';
import {
  ENGINEERING_ALERT_REPOSITORY,
  EngineeringAlertDto,
  IEngineeringAlertRepository,
} from '../ports/engineering-alert.repository.interface';
import { ListEngineeringAlertsQuery } from '../queries/list-engineering-alerts.query';

@QueryHandler(ListEngineeringAlertsQuery)
export class ListEngineeringAlertsHandler implements IQueryHandler<ListEngineeringAlertsQuery> {
  constructor(
    @Inject(ENGINEERING_ALERT_REPOSITORY) private readonly alerts: IEngineeringAlertRepository,
  ) {}
  execute(query: ListEngineeringAlertsQuery): Promise<PaginatedResult<EngineeringAlertDto>> {
    return this.alerts.list(query.page, query.pageSize, query.severity);
  }
}
