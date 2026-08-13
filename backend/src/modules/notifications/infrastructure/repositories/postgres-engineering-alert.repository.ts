import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
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
      id: randomUUID(),
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
}
