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
/**
 * Hash bcrypt "fantasma" comparado quando o e-mail não existe, para que a resposta gaste
 * aproximadamente o mesmo tempo de um login com e-mail válido — evita enumeração de contas
 * por diferença de latência entre "e-mail inexistente" (retorno imediato) e "e-mail existente"
 * (paga o custo do bcrypt).
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('mh-timing-normalization', 12);

export type AuthenticationOutcome =
  { status: 'ok'; session: AuthenticatedSessionDto } | { status: 'invalid' };

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
  ): Promise<AuthenticationOutcome> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    // Sempre roda o bcrypt.compare, mesmo sem usuário encontrado (contra o hash fantasma),
    // e nunca distingue "bloqueada"/"inativa"/"senha errada" na resposta: tudo isso vaza
    // se a conta existe (enumeração) e permite a um atacante confirmar que travou a conta
    // de outra pessoa de propósito.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !user.isActive() || user.isLocked()) {
      return { status: 'invalid' };
    }
    if (!passwordMatches) {
      user.recordFailedLogin();
      await this.users.save(user);
      return { status: 'invalid' };
    }

    const token = `${SESSION_PREFIX}${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    user.resetFailedLogin();
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

    return {
      status: 'ok',
      session: { accessToken: token, expiresAt, user: this.toAuthenticatedUser(user) },
    };
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
