import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DASHBOARD_READ_REPOSITORY,
  IDashboardReadRepository,
} from '../ports/dashboard-read.repository.interface';
import { GetMessageVolumeQuery } from '../queries/get-message-volume.query';

@QueryHandler(GetMessageVolumeQuery)
export class GetMessageVolumeHandler implements IQueryHandler<GetMessageVolumeQuery> {
  constructor(
    @Inject(DASHBOARD_READ_REPOSITORY) private readonly dashboard: IDashboardReadRepository,
  ) {}
  execute(query: GetMessageVolumeQuery) {
    return this.dashboard.getMessageVolume(query.tenantId);
  }
}
