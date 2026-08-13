import { Query } from '@shared/mediator';
import { DashboardOperationalHealthDto } from '../ports/dashboard-read.repository.interface';

export class GetOperationalHealthQuery extends Query<DashboardOperationalHealthDto> {
  constructor(readonly tenantId?: string) {
    super();
  }
}
