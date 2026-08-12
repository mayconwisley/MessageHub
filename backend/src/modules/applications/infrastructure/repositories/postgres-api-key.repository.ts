import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { ApiKey, ApiKeyProps } from '../../domain/entities/api-key.entity';
import { ApiKeyStatus } from '../../domain/enums/api-key-status.enum';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';
import { IApiKeyRepository } from '../../domain/repositories/api-key.repository.interface';
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
  ): Promise<PaginatedResult<ApiKey>> {
    const [rows, total] = await this.repository.findAndCount({
      where: { applicationId: applicationId.value },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
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
    };
    return ApiKey.reconstitute(props, UniqueId.create(row.id));
  }
}
