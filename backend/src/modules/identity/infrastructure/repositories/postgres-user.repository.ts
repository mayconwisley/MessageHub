import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  ListUsersFilter,
} from '../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserOrmMapper } from '../entities/user-orm.mapper';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<void> {
    await this.repository.save(UserOrmMapper.toOrmEntity(user));
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findById(id: UniqueId): Promise<User | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? UserOrmMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repository.findOne({ where: { email: email.trim().toLowerCase() } });
    return row ? UserOrmMapper.toDomain(row) : null;
  }

  async list(
    page: number,
    pageSize: number,
    filter?: ListUsersFilter,
  ): Promise<PaginatedResult<User>> {
    const baseWhere: FindOptionsWhere<UserOrmEntity> = {};
    if (filter?.tenantId) baseWhere.tenantId = filter.tenantId;
    if (filter?.role) baseWhere.role = filter.role;
    if (filter?.status) baseWhere.status = filter.status;

    const where: FindOptionsWhere<UserOrmEntity> | FindOptionsWhere<UserOrmEntity>[] =
      filter?.search
        ? [
            { ...baseWhere, name: ILike(`%${filter.search}%`) },
            { ...baseWhere, email: ILike(`%${filter.search}%`) },
          ]
        : baseWhere;

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => UserOrmMapper.toDomain(row)), total, page, pageSize };
  }
}
