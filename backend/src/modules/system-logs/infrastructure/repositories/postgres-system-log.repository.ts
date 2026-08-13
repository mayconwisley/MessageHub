import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginatedResult } from '@shared/types';
import {
  ISystemLogRepository,
  SystemLogDto,
  SystemLogListFilters,
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
    const levelFilter = filters?.level ? { level: filters.level } : {};
    const searchTerm = filters?.search ? `%${filters.search}%` : undefined;
    const [rows, total] = await this.repository.findAndCount({
      where: searchTerm
        ? [
            { ...levelFilter, message: ILike(searchTerm) },
            { ...levelFilter, context: ILike(searchTerm) },
          ]
        : levelFilter,
      order: { occurredAt: 'DESC' },
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
}
