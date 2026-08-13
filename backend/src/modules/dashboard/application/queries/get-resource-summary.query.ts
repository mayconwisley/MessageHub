import { Query } from '@shared/mediator';
import { DashboardResourceSummaryDto } from '../ports/dashboard-read.repository.interface';

export class GetResourceSummaryQuery extends Query<DashboardResourceSummaryDto> {
  constructor(readonly tenantId?: string) {
    super();
  }
}
