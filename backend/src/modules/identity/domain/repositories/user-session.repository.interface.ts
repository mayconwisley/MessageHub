import { User } from '../entities/user.entity';
import { AuthenticatedUserDto } from '../../application/dto/authenticated-user.dto';

export interface UserSessionRecord {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface IUserSessionRepository {
  /** Persiste a nova sessão e o registro de login do usuário atomicamente. */
  createForUser(user: User, session: UserSessionRecord): Promise<void>;
  findActiveByTokenHash(tokenHash: string): Promise<AuthenticatedUserDto | null>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
}

export const USER_SESSION_REPOSITORY = Symbol('USER_SESSION_REPOSITORY');
