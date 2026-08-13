import { UniqueId } from '@shared/domain';
import { User, UserProps } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';

export class UserOrmMapper {
  static toOrmEntity(user: User): UserOrmEntity {
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
    orm.failedLoginAttempts = user.failedLoginAttempts;
    orm.lockedUntil = user.lockedUntil;
    return orm;
  }

  static toDomain(row: UserOrmEntity): User {
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
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
    };
    return User.reconstitute(props, UniqueId.create(row.id));
  }
}
