import { Query } from '@shared/mediator';
import { DashboardMessageVolumePointDto } from '../ports/dashboard-read.repository.interface';

export class GetMessageVolumeQuery extends Query<DashboardMessageVolumePointDto[]> {
  constructor(readonly tenantId?: string) {
    super();
  }
}
