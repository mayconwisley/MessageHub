import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult, SortDirection } from '@shared/types';
import { AuditLogDto, AuditLogSortField } from '../ports/audit-log.repository.interface';

export class ListAuditLogsQuery extends Query<Result<PaginatedResult<AuditLogDto>, BaseError>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly resourceType?: string,
    public readonly httpMethod?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: AuditLogSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
