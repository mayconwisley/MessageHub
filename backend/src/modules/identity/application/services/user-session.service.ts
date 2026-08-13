import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IUserSessionRepository,
  USER_SESSION_REPOSITORY,
} from '../../domain/repositories/user-session.repository.interface';
import { AuthenticatedSessionDto } from '../dto/authenticated-session.dto';
import { AuthenticatedUserDto } from '../dto/authenticated-user.dto';

const SESSION_PREFIX = 'mh_session_';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** Emite, valida e revoga sessões de usuário administrativo. */
@Injectable()
export class UserSessionService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_SESSION_REPOSITORY) private readonly sessions: IUserSessionRepository,
  ) {}

  async authenticate(
    email: string,
    password: string,
    metadata: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthenticatedSessionDto | null> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user || !user.isActive() || !(await bcrypt.compare(password, user.passwordHash))) {
      return null;
    }

    const token = `${SESSION_PREFIX}${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    user.recordLogin();
    await this.sessions.createForUser(user, {
      id: uuidv7(),
      tokenHash: this.hashToken(token),
      expiresAt,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent?.slice(0, 1024) ?? null,
    });

    return { accessToken: token, expiresAt, user: this.toAuthenticatedUser(user) };
  }

  async resolveSession(token: string): Promise<AuthenticatedUserDto | null> {
    if (!token.startsWith(SESSION_PREFIX)) return null;
    return this.sessions.findActiveByTokenHash(this.hashToken(token));
  }

  async revokeSession(token: string): Promise<void> {
    await this.sessions.revokeByTokenHash(this.hashToken(token));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthenticatedUser(user: User): AuthenticatedUserDto {
    return { id: user.id.value, email: user.email, role: user.role, tenantId: user.tenantId };
  }
}
