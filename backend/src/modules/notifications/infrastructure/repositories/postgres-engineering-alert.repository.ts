import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v7 as uuidv7 } from 'uuid';
import { FindOptionsOrder, Repository } from 'typeorm';
import { PaginatedResult, SortDirection } from '@shared/types';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import {
  CreateEngineeringAlertInput,
  EngineeringAlertDto,
  EngineeringAlertSortField,
  IEngineeringAlertRepository,
  ListEngineeringAlertsFilter,
} from '../../application/ports/engineering-alert.repository.interface';
import { EngineeringAlertOrmEntity } from '../entities/engineering-alert.orm-entity';

@Injectable()
export class PostgresEngineeringAlertRepository implements IEngineeringAlertRepository {
  constructor(
    @InjectRepository(EngineeringAlertOrmEntity)
    private readonly repository: Repository<EngineeringAlertOrmEntity>,
  ) {}
  async create(input: CreateEngineeringAlertInput): Promise<EngineeringAlertDto> {
    const alert = this.repository.create({
      id: uuidv7(),
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message.slice(0, 4000),
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
      dispatchedAt: null,
    });
    await this.repository.save(alert);
    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity as EngineeringAlertDto['severity'],
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata,
      occurredAt: alert.occurredAt,
      dispatchedAt: alert.dispatchedAt,
    };
  }
  async markDispatched(id: string): Promise<void> {
    await this.repository.update(id, { dispatchedAt: new Date() });
  }
  async list(
    page: number,
    pageSize: number,
    filter?: ListEngineeringAlertsFilter,
  ): Promise<PaginatedResult<EngineeringAlertDto>> {
    const occurredAtRange = resolveDateRangeOperator(filter?.createdFrom, filter?.createdTo);
    const [rows, total] = await this.repository.findAndCount({
      where: {
        ...(filter?.severity ? { severity: filter.severity } : {}),
        ...(occurredAtRange ? { occurredAt: occurredAtRange } : {}),
      },
      order: this.resolveOrder(filter?.sortBy, filter?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      items: rows.map((row) => ({
        id: row.id,
        type: row.type,
        severity: row.severity as EngineeringAlertDto['severity'],
        title: row.title,
        message: row.message,
        metadata: row.metadata,
        occurredAt: row.occurredAt,
        dispatchedAt: row.dispatchedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  private resolveOrder(
    sortBy?: EngineeringAlertSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<EngineeringAlertOrmEntity> {
    const field = sortBy ?? EngineeringAlertSortField.OCCURRED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }
}
