import { Query } from '@shared/mediator';
import { OperationalSummaryDto } from '../ports/monitoring-read.repository.interface';

export class GetOperationalSummaryQuery extends Query<OperationalSummaryDto> {
  constructor() {
    super();
  }
}
