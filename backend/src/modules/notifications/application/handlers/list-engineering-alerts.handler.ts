import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
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
  async execute(
    query: ListEngineeringAlertsQuery,
  ): Promise<Result<PaginatedResult<EngineeringAlertDto>, BaseError>> {
    const result = await this.alerts.list(query.page, query.pageSize, {
      severity: query.severity,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return Result.ok(result);
  }
}
