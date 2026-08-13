import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { User, UserProps } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  ListUsersFilter,
} from '../../domain/repositories/user.repository.interface';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<void> {
    await this.repository.save(this.toOrmEntity(user));
  }

  async findById(id: UniqueId): Promise<User | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repository.findOne({ where: { email: email.trim().toLowerCase() } });
    return row ? this.toDomain(row) : null;
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
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private toOrmEntity(user: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = user.id.value;
    orm.tenantId = user.tenantId;
    orm.name = user.name;
    orm.email = user.email;
    orm.passwordHash = user.passwordHash;
    orm.role = user.role;
    orm.status = user.status;
    orm.createdAt = user.createdAt;
    orm.updatedAt = user.updatedAt;
    orm.lastLoginAt = user.lastLoginAt;
    return orm;
  }

  private toDomain(row: UserOrmEntity): User {
    const props: UserProps = {
      tenantId: row.tenantId,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastLoginAt: row.lastLoginAt,
    };
    return User.reconstitute(props, UniqueId.create(row.id));
  }
}
