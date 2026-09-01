import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import { Tenant, TenantProps } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import {
  ITenantRepository,
  ListTenantsFilter,
  TenantSortField,
} from '../../domain/repositories/tenant.repository.interface';
import { TenantOrmEntity } from '../entities/tenant.orm-entity';
import { PaginatedResult, SortDirection } from '@shared/types';

@Injectable()
export class PostgresTenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly repository: Repository<TenantOrmEntity>,
  ) {}

  async save(tenant: Tenant): Promise<void> {
    await this.repository.save(this.toOrmEntity(tenant));
  }

  async findById(id: UniqueId): Promise<Tenant | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async list(
    page: number,
    pageSize: number,
    filter?: ListTenantsFilter,
  ): Promise<PaginatedResult<Tenant>> {
    const where: FindOptionsWhere<TenantOrmEntity> = {};
    if (filter?.status) where.status = filter.status;
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
    sortBy?: TenantSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<TenantOrmEntity> {
    const field = sortBy ?? TenantSortField.CREATED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }

  private toOrmEntity(tenant: Tenant): TenantOrmEntity {
    const orm = new TenantOrmEntity();
    orm.id = tenant.id.value;
    orm.name = tenant.name;
    orm.status = tenant.status;
    orm.createdAt = tenant.createdAt;
    return orm;
  }

  private toDomain(row: TenantOrmEntity): Tenant {
    const props: TenantProps = {
      name: row.name,
      status: row.status as TenantStatus,
      createdAt: row.createdAt,
    };
    return Tenant.reconstitute(props, UniqueId.create(row.id));
  }
}
