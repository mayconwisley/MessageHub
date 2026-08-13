import { Query } from '@shared/mediator';
import { DashboardRecentMessageDto } from '../ports/dashboard-read.repository.interface';

export class GetRecentMessagesQuery extends Query<DashboardRecentMessageDto[]> {
  constructor(readonly tenantId?: string) {
    super();
  }
}
