import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { Application, ApplicationProps } from '../../domain/entities/application.entity';
import { ApplicationStatus } from '../../domain/enums/application-status.enum';
import { IApplicationRepository } from '../../domain/repositories/application.repository.interface';
import { ApplicationOrmEntity } from '../entities/application.orm-entity';
import { PaginatedResult } from '@shared/types';

@Injectable()
export class PostgresApplicationRepository implements IApplicationRepository {
  constructor(
    @InjectRepository(ApplicationOrmEntity)
    private readonly repository: Repository<ApplicationOrmEntity>,
  ) {}

  async save(application: Application): Promise<void> {
    await this.repository.save(this.toOrmEntity(application));
  }

  async findById(id: UniqueId): Promise<Application | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Application>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { tenantId: tenantId.value },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private toOrmEntity(application: Application): ApplicationOrmEntity {
    const orm = new ApplicationOrmEntity();
    orm.id = application.id.value;
    orm.tenantId = application.tenantId.value;
    orm.name = application.name;
    orm.status = application.status;
    orm.webhookUrl = application.webhookUrl;
    orm.webhookSecret = application.webhookSecret;
    orm.quotaPerMinute = application.quotaPerMinute;
    orm.quotaPerDay = application.quotaPerDay;
    orm.createdAt = application.createdAt;
    return orm;
  }

  private toDomain(row: ApplicationOrmEntity): Application {
    const props: ApplicationProps = {
      tenantId: UniqueId.create(row.tenantId),
      name: row.name,
      status: row.status as ApplicationStatus,
      webhookUrl: row.webhookUrl,
      webhookSecret: row.webhookSecret,
      quotaPerMinute: row.quotaPerMinute ?? 60,
      quotaPerDay: row.quotaPerDay ?? 10_000,
      createdAt: row.createdAt,
    };
    return Application.reconstitute(props, UniqueId.create(row.id));
  }
}
