import { Query } from '@shared/mediator';
import { DashboardDeliveryStatusDto } from '../ports/dashboard-read.repository.interface';

export class GetDeliveryStatusQuery extends Query<DashboardDeliveryStatusDto> {
  constructor(readonly tenantId?: string) {
    super();
  }
}
