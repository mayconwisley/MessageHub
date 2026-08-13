import { Query } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import {
  EngineeringAlertDto,
  EngineeringAlertSeverity,
} from '../ports/engineering-alert.repository.interface';

export class ListEngineeringAlertsQuery extends Query<PaginatedResult<EngineeringAlertDto>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly severity?: EngineeringAlertSeverity,
  ) {
    super();
  }
}
