import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DASHBOARD_READ_REPOSITORY,
  IDashboardReadRepository,
} from '../ports/dashboard-read.repository.interface';
import { GetDeliveryStatusQuery } from '../queries/get-delivery-status.query';

@QueryHandler(GetDeliveryStatusQuery)
export class GetDeliveryStatusHandler implements IQueryHandler<GetDeliveryStatusQuery> {
  constructor(
    @Inject(DASHBOARD_READ_REPOSITORY) private readonly dashboard: IDashboardReadRepository,
  ) {}
  execute(query: GetDeliveryStatusQuery) {
    return this.dashboard.getDeliveryStatus(query.tenantId);
  }
}
