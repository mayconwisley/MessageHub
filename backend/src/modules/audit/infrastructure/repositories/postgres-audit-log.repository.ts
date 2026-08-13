import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '@shared/types';
import {
  AuditLogDto,
  AuditLogListFilters,
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
    const [rows, total] = await this.repository.findAndCount({
      where: {
        ...(filters?.resourceType ? { resourceType: filters.resourceType } : {}),
        ...(filters?.httpMethod ? { httpMethod: filters.httpMethod } : {}),
      },
      order: { occurredAt: 'DESC' },
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
}
