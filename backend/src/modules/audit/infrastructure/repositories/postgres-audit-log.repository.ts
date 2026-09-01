import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, Repository } from 'typeorm';
import { PaginatedResult, SortDirection } from '@shared/types';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import {
  AuditLogDto,
  AuditLogListFilters,
  AuditLogSortField,
  IAuditLogRepository,
} from '../../application/ports/audit-log.repository.interface';
import { AuditLogOrmEntity } from '../entities/audit-log.orm-entity';

@Injectable()
export class PostgresAuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity) private readonly repository: Repository<AuditLogOrmEntity>,
  ) {}

  async list(
    page: number,
    pageSize: number,
    filters?: AuditLogListFilters,
  ): Promise<PaginatedResult<AuditLogDto>> {
    const occurredAtRange = resolveDateRangeOperator(filters?.createdFrom, filters?.createdTo);
    const [rows, total] = await this.repository.findAndCount({
      where: {
        ...(filters?.resourceType ? { resourceType: filters.resourceType } : {}),
        ...(filters?.httpMethod ? { httpMethod: filters.httpMethod } : {}),
        ...(occurredAtRange ? { occurredAt: occurredAtRange } : {}),
      },
      order: this.resolveOrder(filters?.sortBy, filters?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        actorUserId: row.actorUserId,
        actorEmail: row.actorEmail,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        tenantId: row.tenantId,
        requestId: row.requestId,
        httpMethod: row.httpMethod,
        httpPath: row.httpPath,
        httpStatus: row.httpStatus,
        metadata: row.metadata,
      })),
      total,
      page,
      pageSize,
    };
  }

  private resolveOrder(
    sortBy?: AuditLogSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<AuditLogOrmEntity> {
    const field = sortBy ?? AuditLogSortField.OCCURRED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }
}
