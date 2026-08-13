import { v7 as uuidv7 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogOrmEntity } from '../entities/audit-log.orm-entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogOrmEntity) private readonly repository: Repository<AuditLogOrmEntity>,
  ) {}

  async record(entry: Omit<AuditLogOrmEntity, 'id' | 'occurredAt'>): Promise<void> {
    await this.repository.save({ id: uuidv7(), occurredAt: new Date(), ...entry });
  }
}
