import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
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

  execute(query: ListSystemLogsQuery): Promise<PaginatedResult<SystemLogDto>> {
    return this.systemLogs.list(query.page, query.pageSize, {
      level: query.level,
      search: query.search,
    });
  }
}
