import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import {
  IUserSessionRepository,
  UserSessionRecord,
} from '../../domain/repositories/user-session.repository.interface';
import { AuthenticatedUserDto } from '../../application/dto/authenticated-user.dto';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { UserOrmMapper } from '../entities/user-orm.mapper';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserSessionOrmEntity } from '../entities/user-session.orm-entity';

@Injectable()
export class PostgresUserSessionRepository implements IUserSessionRepository {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly users: Repository<UserOrmEntity>,
    @InjectRepository(UserSessionOrmEntity)
    private readonly sessions: Repository<UserSessionOrmEntity>,
  ) {}

  async createForUser(user: User, session: UserSessionRecord): Promise<void> {
    const userOrm = UserOrmMapper.toOrmEntity(user);
    const sessionOrm = Object.assign(new UserSessionOrmEntity(), { ...session, userId: user.id.value, revokedAt: null });
    await this.users.manager.transaction(async (manager) => {
      await manager.save(userOrm);
      await manager.save(sessionOrm);
    });
  }

  async findActiveByTokenHash(tokenHash: string): Promise<AuthenticatedUserDto | null> {
    const session = await this.sessions
      .createQueryBuilder('session')
      .innerJoinAndSelect(UserOrmEntity, 'user', 'user.id = session.user_id')
      .where('session.token_hash = :tokenHash', { tokenHash })
      .andWhere('session.revoked_at IS NULL')
      .andWhere('session.expires_at > NOW()')
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getRawOne<{
        user_id: string;
        user_email: string;
        user_role: UserRole;
        user_tenant_id: string | null;
      }>();
    if (!session) return null;
    return {
      id: session.user_id,
      email: session.user_email,
      role: session.user_role,
      tenantId: session.user_tenant_id,
    };
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.sessions.update({ tokenHash, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
