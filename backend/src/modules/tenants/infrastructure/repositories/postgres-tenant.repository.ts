import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { Tenant, TenantProps } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';
import { TenantOrmEntity } from '../entities/tenant.orm-entity';
import { PaginatedResult } from '@shared/types';

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

  async list(page: number, pageSize: number): Promise<PaginatedResult<Tenant>> {
    const [rows, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
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
