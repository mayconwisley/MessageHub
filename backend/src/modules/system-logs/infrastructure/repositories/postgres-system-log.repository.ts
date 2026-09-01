import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, ILike, Repository } from 'typeorm';
import { PaginatedResult, SortDirection } from '@shared/types';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import {
  ISystemLogRepository,
  SystemLogDto,
  SystemLogListFilters,
  SystemLogSortField,
} from '../../application/ports/system-log.repository.interface';
import { SystemLogOrmEntity } from '../entities/system-log.orm-entity';

@Injectable()
export class PostgresSystemLogRepository implements ISystemLogRepository {
  constructor(
    @InjectRepository(SystemLogOrmEntity)
    private readonly repository: Repository<SystemLogOrmEntity>,
  ) {}

  async list(
    page: number,
    pageSize: number,
    filters?: SystemLogListFilters,
  ): Promise<PaginatedResult<SystemLogDto>> {
    const occurredAtRange = resolveDateRangeOperator(filters?.createdFrom, filters?.createdTo);
    const baseFilter = {
      ...(filters?.level ? { level: filters.level } : {}),
      ...(occurredAtRange ? { occurredAt: occurredAtRange } : {}),
    };
    const searchTerm = filters?.search ? `%${filters.search}%` : undefined;
    const [rows, total] = await this.repository.findAndCount({
      where: searchTerm
        ? [
            { ...baseFilter, message: ILike(searchTerm) },
            { ...baseFilter, context: ILike(searchTerm) },
          ]
        : baseFilter,
      order: this.resolveOrder(filters?.sortBy, filters?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurredAt,
        level: row.level as SystemLogDto['level'],
        context: row.context,
        message: row.message,
        requestId: row.requestId,
        metadata: row.metadata,
      })),
      total,
      page,
      pageSize,
    };
  }

  private resolveOrder(
    sortBy?: SystemLogSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<SystemLogOrmEntity> {
    const field = sortBy ?? SystemLogSortField.OCCURRED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }
}
