import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DASHBOARD_READ_REPOSITORY,
  IDashboardReadRepository,
} from '../ports/dashboard-read.repository.interface';
import { GetOperationalHealthQuery } from '../queries/get-operational-health.query';

@QueryHandler(GetOperationalHealthQuery)
export class GetOperationalHealthHandler implements IQueryHandler<GetOperationalHealthQuery> {
  constructor(
    @Inject(DASHBOARD_READ_REPOSITORY) private readonly dashboard: IDashboardReadRepository,
  ) {}
  execute(query: GetOperationalHealthQuery) {
    return this.dashboard.getOperationalHealth(query.tenantId);
  }
}
