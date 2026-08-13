import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
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

  execute(query: ListAuditLogsQuery): Promise<PaginatedResult<AuditLogDto>> {
    return this.auditLogs.list(query.page, query.pageSize, {
      resourceType: query.resourceType,
      httpMethod: query.httpMethod,
    });
  }
}
