import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApiKeyDto } from '../dto/api-key.dto';

export class ListApiKeysQuery extends Query<
  Result<PaginatedResult<ApiKeyDto>, ApplicationNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
  ) {
    super();
  }
}
