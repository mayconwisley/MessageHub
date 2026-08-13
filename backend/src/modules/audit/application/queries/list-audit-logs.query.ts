import { Query } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { AuditLogDto } from '../ports/audit-log.repository.interface';

export class ListAuditLogsQuery extends Query<PaginatedResult<AuditLogDto>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly resourceType?: string,
    public readonly httpMethod?: string,
  ) {
    super();
  }
}
