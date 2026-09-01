import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult, SortDirection } from '@shared/types';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import { ApiKey, ApiKeyProps } from '../../domain/entities/api-key.entity';
import { ApiKeyStatus } from '../../domain/enums/api-key-status.enum';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';
import {
  ApiKeySortField,
  IApiKeyRepository,
  ListApiKeysFilter,
} from '../../domain/repositories/api-key.repository.interface';
import { ApiKeyOrmEntity } from '../entities/api-key.orm-entity';

@Injectable()
export class PostgresApiKeyRepository implements IApiKeyRepository {
  constructor(
    @InjectRepository(ApiKeyOrmEntity)
    private readonly repository: Repository<ApiKeyOrmEntity>,
  ) {}

  async save(apiKey: ApiKey): Promise<void> {
    await this.repository.save(this.toOrmEntity(apiKey));
  }

  async findById(id: UniqueId): Promise<ApiKey | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListApiKeysFilter,
  ): Promise<PaginatedResult<ApiKey>> {
    const createdAtRange = resolveDateRangeOperator(filter?.createdFrom, filter?.createdTo);
    const where: FindOptionsWhere<ApiKeyOrmEntity> = {
      applicationId: applicationId.value,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.search ? { prefix: ILike(`%${filter.search}%`) } : {}),
      ...(createdAtRange ? { createdAt: createdAtRange } : {}),
    };

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: this.resolveOrder(filter?.sortBy, filter?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private resolveOrder(
    sortBy?: ApiKeySortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<ApiKeyOrmEntity> {
    const field = sortBy ?? ApiKeySortField.CREATED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }

  async recordUsage(id: UniqueId, ipAddress?: string): Promise<void> {
    await this.repository.update(id.value, {
      lastUsedAt: new Date(),
      lastUsedIp: ipAddress ?? null,
    });
  }

  private toOrmEntity(apiKey: ApiKey): ApiKeyOrmEntity {
    const orm = new ApiKeyOrmEntity();
    orm.id = apiKey.id.value;
    orm.applicationId = apiKey.applicationId.value;
    orm.hash = apiKey.hash;
    orm.prefix = apiKey.prefix;
    orm.status = apiKey.status;
    orm.type = apiKey.type;
    orm.createdAt = apiKey.createdAt;
    orm.expiresAt = apiKey.expiresAt;
    orm.scopes = apiKey.scopes;
    orm.lastUsedAt = apiKey.lastUsedAt;
    orm.lastUsedIp = apiKey.lastUsedIp;
    return orm;
  }

  private toDomain(row: ApiKeyOrmEntity): ApiKey {
    const props: ApiKeyProps = {
      applicationId: UniqueId.create(row.applicationId),
      hash: row.hash,
      prefix: row.prefix,
      status: row.status as ApiKeyStatus,
      type: row.type as ApiKeyType,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      scopes: row.scopes ?? [],
      lastUsedAt: row.lastUsedAt,
      lastUsedIp: row.lastUsedIp,
    };
    return ApiKey.reconstitute(props, UniqueId.create(row.id));
  }
}
