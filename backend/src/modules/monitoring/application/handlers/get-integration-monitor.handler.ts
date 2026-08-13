import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import {
  IMonitoringReadRepository,
  IntegrationMonitorDto,
  MONITORING_READ_REPOSITORY,
} from '../ports/monitoring-read.repository.interface';
import { GetIntegrationMonitorQuery } from '../queries/get-integration-monitor.query';
@QueryHandler(GetIntegrationMonitorQuery)
export class GetIntegrationMonitorHandler implements IQueryHandler<GetIntegrationMonitorQuery> {
  constructor(
    @Inject(MONITORING_READ_REPOSITORY) private readonly monitor: IMonitoringReadRepository,
  ) {}
  async execute(
    query: GetIntegrationMonitorQuery,
  ): Promise<Result<IntegrationMonitorDto, ApplicationNotFoundError>> {
    const result = await this.monitor.getIntegrationMonitor(query.applicationId);
    return result
      ? Result.ok(result)
      : Result.fail(new ApplicationNotFoundError(query.applicationId));
  }
}
