import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApiKeySortField } from '../../domain/repositories/api-key.repository.interface';
import { ApiKeyStatus } from '../../domain/enums/api-key-status.enum';
import { ApiKeyDto } from '../dto/api-key.dto';

export class ListApiKeysQuery extends Query<
  Result<PaginatedResult<ApiKeyDto>, ApplicationNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: ApiKeyStatus,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: ApiKeySortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
