import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult, SortDirection } from '@shared/types';
import {
  SystemLogDto,
  SystemLogLevel,
  SystemLogSortField,
} from '../ports/system-log.repository.interface';

export class ListSystemLogsQuery extends Query<Result<PaginatedResult<SystemLogDto>, BaseError>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly level?: SystemLogLevel,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: SystemLogSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
