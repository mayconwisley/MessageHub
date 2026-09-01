import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult, SortDirection } from '@shared/types';
import { resolveDateRangeOperator } from '@shared/persistence/resolve-date-range-operator.util';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  ListUsersFilter,
  UserSortField,
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
    const createdAtRange = resolveDateRangeOperator(filter?.createdFrom, filter?.createdTo);
    const baseWhere: FindOptionsWhere<UserOrmEntity> = {};
    if (filter?.tenantId) baseWhere.tenantId = filter.tenantId;
    if (filter?.role) baseWhere.role = filter.role;
    if (filter?.status) baseWhere.status = filter.status;
    if (createdAtRange) baseWhere.createdAt = createdAtRange;

    const where: FindOptionsWhere<UserOrmEntity> | FindOptionsWhere<UserOrmEntity>[] =
      filter?.search
        ? [
            { ...baseWhere, name: ILike(`%${filter.search}%`) },
            { ...baseWhere, email: ILike(`%${filter.search}%`) },
          ]
        : baseWhere;

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: this.resolveOrder(filter?.sortBy, filter?.sortDirection),
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => UserOrmMapper.toDomain(row)), total, page, pageSize };
  }

  private resolveOrder(
    sortBy?: UserSortField,
    sortDirection?: SortDirection,
  ): FindOptionsOrder<UserOrmEntity> {
    const field = sortBy ?? UserSortField.CREATED_AT;
    const direction = sortDirection ?? SortDirection.DESC;
    return { [field]: direction };
  }
}
