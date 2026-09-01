import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult } from '@shared/types';
import {
  ISystemLogRepository,
  SYSTEM_LOG_REPOSITORY,
  SystemLogDto,
} from '../ports/system-log.repository.interface';
import { ListSystemLogsQuery } from '../queries/list-system-logs.query';

@QueryHandler(ListSystemLogsQuery)
export class ListSystemLogsHandler implements IQueryHandler<ListSystemLogsQuery> {
  constructor(@Inject(SYSTEM_LOG_REPOSITORY) private readonly systemLogs: ISystemLogRepository) {}

  async execute(
    query: ListSystemLogsQuery,
  ): Promise<Result<PaginatedResult<SystemLogDto>, BaseError>> {
    const result = await this.systemLogs.list(query.page, query.pageSize, {
      level: query.level,
      search: query.search,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return Result.ok(result);
  }
}
