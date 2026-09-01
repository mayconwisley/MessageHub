import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult } from '@shared/types';
import {
  AUDIT_LOG_REPOSITORY,
  AuditLogDto,
  IAuditLogRepository,
} from '../ports/audit-log.repository.interface';
import { ListAuditLogsQuery } from '../queries/list-audit-logs.query';

@QueryHandler(ListAuditLogsQuery)
export class ListAuditLogsHandler implements IQueryHandler<ListAuditLogsQuery> {
  constructor(@Inject(AUDIT_LOG_REPOSITORY) private readonly auditLogs: IAuditLogRepository) {}

  async execute(
    query: ListAuditLogsQuery,
  ): Promise<Result<PaginatedResult<AuditLogDto>, BaseError>> {
    const result = await this.auditLogs.list(query.page, query.pageSize, {
      resourceType: query.resourceType,
      httpMethod: query.httpMethod,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return Result.ok(result);
  }
}
