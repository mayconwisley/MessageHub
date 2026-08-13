import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { ApplicationDto } from '../dto/application.dto';
export class ListApplicationsQuery extends Query<
  Result<PaginatedResult<ApplicationDto>, BaseError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly search?: string,
  ) {
    super();
  }
}
