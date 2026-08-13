import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DASHBOARD_READ_REPOSITORY,
  IDashboardReadRepository,
} from '../ports/dashboard-read.repository.interface';
import { GetResourceSummaryQuery } from '../queries/get-resource-summary.query';

@QueryHandler(GetResourceSummaryQuery)
export class GetResourceSummaryHandler implements IQueryHandler<GetResourceSummaryQuery> {
  constructor(
    @Inject(DASHBOARD_READ_REPOSITORY) private readonly dashboard: IDashboardReadRepository,
  ) {}
  execute(query: GetResourceSummaryQuery) {
    return this.dashboard.getResourceSummary(query.tenantId);
  }
}
