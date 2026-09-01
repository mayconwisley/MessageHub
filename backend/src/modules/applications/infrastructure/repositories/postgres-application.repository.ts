import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import { Application, ApplicationProps } from '../../domain/entities/application.entity';
import { ApplicationStatus } from '../../domain/enums/application-status.enum';
import {
  ApplicationSortField,
  IApplicationRepository,
  ListApplicationsFilter,
} from '../../domain/repositories/application.repository.interface';
import { ApplicationOrmEntity } from '../entities/application.orm-entity';
import { PaginatedResult, SortDirection } from '@shared/types';
import { WebhookSecretCipherService } from '../security/webhook-secret-cipher.service';

@Injectable()
export class PostgresApplicationRepository implements IApplicationRepository {
  constructor(
    @InjectRepository(ApplicationOrmEntity)
    private readonly repository: Repository<ApplicationOrmEntity>,
    private readonly webhookSecretCipher: WebhookSecretCipherService,
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
    filter?: ListApplicationsFilter,
  ): Promise<PaginatedResult<Application>> {
    const where: FindOptionsWhere<ApplicationOrmEntity> = { tenantId: tenantId.value };
    if (filter?.search) where.name = ILike(`%${filter.search}%`);
    const createdAtRange = resolveDateRangeOperator(filter?.createdFrom, filter?.createdTo);
    if (createdAtRange) where.createdAt = createdAtRange;

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: this.resolveOrder(filter?.sortBy, filter?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private resolveOrder(
    sortBy?: ApplicationSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<ApplicationOrmEntity> {
    const field = sortBy ?? ApplicationSortField.CREATED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }

  private toOrmEntity(application: Application): ApplicationOrmEntity {
    const orm = new ApplicationOrmEntity();
    orm.id = application.id.value;
    orm.tenantId = application.tenantId.value;
    orm.name = application.name;
    orm.status = application.status;
    orm.webhookUrl = application.webhookUrl;
    orm.webhookSecret = application.webhookSecret
      ? this.webhookSecretCipher.encrypt(application.webhookSecret)
      : null;
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
      webhookSecret: row.webhookSecret ? this.webhookSecretCipher.decrypt(row.webhookSecret) : null,
      quotaPerMinute: row.quotaPerMinute ?? 60,
      quotaPerDay: row.quotaPerDay ?? 10_000,
      createdAt: row.createdAt,
    };
    return Application.reconstitute(props, UniqueId.create(row.id));
  }
}
