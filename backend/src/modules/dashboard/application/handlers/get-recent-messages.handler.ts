import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DASHBOARD_READ_REPOSITORY,
  IDashboardReadRepository,
} from '../ports/dashboard-read.repository.interface';
import { GetRecentMessagesQuery } from '../queries/get-recent-messages.query';

@QueryHandler(GetRecentMessagesQuery)
export class GetRecentMessagesHandler implements IQueryHandler<GetRecentMessagesQuery> {
  constructor(
    @Inject(DASHBOARD_READ_REPOSITORY) private readonly dashboard: IDashboardReadRepository,
  ) {}
  execute(query: GetRecentMessagesQuery) {
    return this.dashboard.getRecentMessages(query.tenantId);
  }
}
