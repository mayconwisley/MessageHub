import { createHash, randomBytes, randomUUID } from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsNull, Repository } from 'typeorm';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { AuthenticatedUserDto } from '../../application/dto/authenticated-user.dto';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserSessionOrmEntity } from '../entities/user-session.orm-entity';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';

const PASSWORD_COST = 12;
const SESSION_PREFIX = 'mh_session_';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class IdentityService implements OnModuleInit {
  constructor(
    @InjectRepository(UserOrmEntity) private readonly users: Repository<UserOrmEntity>,
    @InjectRepository(UserSessionOrmEntity)
    private readonly sessions: Repository<UserSessionOrmEntity>,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (await this.hasUsers()) return;
    await this.createUser({
      name: 'Platform Administrator',
      email: this.appConfig.initialPlatformAdminEmail,
      password: this.appConfig.initialPlatformAdminPassword,
      role: UserRole.PLATFORM_ADMIN,
    });
  }

  async hasUsers(): Promise<boolean> {
    return (await this.users.count()) > 0;
  }

  async createUser(params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    tenantId?: string;
  }): Promise<AuthenticatedUserDto> {
    const user = new UserOrmEntity();
    user.id = randomUUID();
    user.name = params.name.trim();
    user.email = params.email.trim().toLowerCase();
    user.passwordHash = await bcrypt.hash(params.password, PASSWORD_COST);
    user.role = params.role;
    user.tenantId = params.tenantId ?? null;
    user.status = UserStatus.ACTIVE;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.lastLoginAt = null;
    await this.users.save(user);
    return this.toAuthenticatedUser(user);
  }

  async authenticate(
    email: string,
    password: string,
    metadata: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return null;
    }

    const token = `${SESSION_PREFIX}${randomBytes(32).toString('base64url')}`;
    const session = new UserSessionOrmEntity();
    session.id = randomUUID();
    session.userId = user.id;
    session.tokenHash = this.hashToken(token);
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    session.revokedAt = null;
    session.createdAt = new Date();
    session.lastUsedAt = new Date();
    session.ipAddress = metadata.ipAddress ?? null;
    session.userAgent = metadata.userAgent?.slice(0, 1024) ?? null;
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    await this.users.manager.transaction(async (manager) => {
      await manager.save(user);
      await manager.save(session);
    });

    return {
      accessToken: token,
      expiresAt: session.expiresAt,
      user: this.toAuthenticatedUser(user),
    };
  }

  async resolveSession(token: string): Promise<AuthenticatedUserDto | null> {
    if (!token.startsWith(SESSION_PREFIX)) return null;
    const session = await this.sessions
      .createQueryBuilder('session')
      .innerJoinAndSelect(UserOrmEntity, 'user', 'user.id = session.user_id')
      .where('session.token_hash = :tokenHash', { tokenHash: this.hashToken(token) })
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

  async revokeSession(token: string): Promise<void> {
    await this.sessions.update(
      { tokenHash: this.hashToken(token), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthenticatedUser(user: UserOrmEntity): AuthenticatedUserDto {
    return { id: user.id, email: user.email, role: user.role as UserRole, tenantId: user.tenantId };
  }
}
