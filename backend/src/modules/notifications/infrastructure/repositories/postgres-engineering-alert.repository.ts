import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Repository } from 'typeorm';
import { PaginatedResult } from '@shared/types';
import {
  CreateEngineeringAlertInput,
  EngineeringAlertDto,
  IEngineeringAlertRepository,
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
    severity?: EngineeringAlertDto['severity'],
  ): Promise<PaginatedResult<EngineeringAlertDto>> {
    const [rows, total] = await this.repository.findAndCount({
      where: severity ? { severity } : {},
      order: { occurredAt: 'DESC' },
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
}
