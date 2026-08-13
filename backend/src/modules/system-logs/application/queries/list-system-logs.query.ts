import { Query } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { SystemLogDto, SystemLogLevel } from '../ports/system-log.repository.interface';

export class ListSystemLogsQuery extends Query<PaginatedResult<SystemLogDto>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly level?: SystemLogLevel,
    public readonly search?: string,
  ) {
    super();
  }
}
