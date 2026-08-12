import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { ApplicationDto } from '../dto/application.dto';
export class ListApplicationsQuery extends Query<Result<PaginatedResult<ApplicationDto>>> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
  ) {
    super();
  }
}
