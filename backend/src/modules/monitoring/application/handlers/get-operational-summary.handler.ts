import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IMonitoringReadRepository,
  MONITORING_READ_REPOSITORY,
  OperationalSummaryDto,
} from '../ports/monitoring-read.repository.interface';
import { GetOperationalSummaryQuery } from '../queries/get-operational-summary.query';

@QueryHandler(GetOperationalSummaryQuery)
export class GetOperationalSummaryHandler implements IQueryHandler<GetOperationalSummaryQuery> {
  constructor(
    @Inject(MONITORING_READ_REPOSITORY) private readonly repository: IMonitoringReadRepository,
  ) {}

  execute(): Promise<OperationalSummaryDto> {
    return this.repository.getOperationalSummary();
  }
}
