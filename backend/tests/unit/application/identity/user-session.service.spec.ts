import * as bcrypt from 'bcryptjs';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { User } from '@modules/identity/domain/entities/user.entity';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { IUserRepository } from '@modules/identity/domain/repositories/user.repository.interface';
import {
  IUserSessionRepository,
  UserSessionRecord,
} from '@modules/identity/domain/repositories/user-session.repository.interface';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure) throw new Error(`esperava sucesso: ${JSON.stringify(result.error)}`);
  return result.value;
}

class FakeUserRepository implements IUserRepository {
  private readonly byEmail = new Map<string, User>();
  readonly saved: User[] = [];

  seed(user: User): void {
    this.byEmail.set(user.email, user);
  }

  async save(user: User): Promise<void> {
    this.saved.push(user);
    this.byEmail.set(user.email, user);
  }

  async count(): Promise<number> {
    return this.byEmail.size;
  }

  async findById(): Promise<User | null> {
    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.byEmail.get(email) ?? null;
  }

  async list(): Promise<PaginatedResult<User>> {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
}

class FakeUserSessionRepository implements IUserSessionRepository {
  readonly created: { user: User; session: UserSessionRecord }[] = [];

  async createForUser(user: User, session: UserSessionRecord): Promise<void> {
    this.created.push({ user, session });
  }

  async findActiveByTokenHash(): Promise<AuthenticatedUserDto | null> {
    return null;
  }

  async revokeByTokenHash(): Promise<void> {}
}

async function createActiveUser(password: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 4);
  return expectOk(
    User.create({ name: 'Ana', email: 'ana@hub.com', passwordHash, role: UserRole.TENANT_ADMIN }),
  );
}

describe('UserSessionService.authenticate', () => {
  let users: FakeUserRepository;
  let sessions: FakeUserSessionRepository;
  let service: UserSessionService;

  beforeEach(() => {
    users = new FakeUserRepository();
    sessions = new FakeUserSessionRepository();
    service = new UserSessionService(users, sessions);
  });

  it('retorna invalid quando o e-mail não existe', async () => {
    await expect(service.authenticate('unknown@hub.com', 'x', {})).resolves.toEqual({
      status: 'invalid',
    });
    expect(sessions.created).toHaveLength(0);
  });

  it('retorna invalid quando a senha está errada e incrementa o contador', async () => {
    const user = await createActiveUser('correct-password');
    users.seed(user);

    const outcome = await service.authenticate('ana@hub.com', 'wrong-password', {});

    expect(outcome).toEqual({ status: 'invalid' });
    expect(users.saved).toHaveLength(1);
    expect(users.saved[0].failedLoginAttempts).toBe(1);
  });

  it('bloqueia a conta na 5ª tentativa de senha errada', async () => {
    const user = await createActiveUser('correct-password');
    users.seed(user);

    for (let i = 0; i < 4; i += 1) {
      await service.authenticate('ana@hub.com', 'wrong-password', {});
    }
    const outcome = await service.authenticate('ana@hub.com', 'wrong-password', {});

    expect(outcome.status).toBe('locked');
    expect(users.saved[users.saved.length - 1].failedLoginAttempts).toBe(0);
    expect(sessions.created).toHaveLength(0);
  });

  it('rejeita login com senha correta enquanto a conta estiver bloqueada', async () => {
    const user = await createActiveUser('correct-password');
    users.seed(user);
    for (let i = 0; i < 5; i += 1) {
      await service.authenticate('ana@hub.com', 'wrong-password', {});
    }

    const outcome = await service.authenticate('ana@hub.com', 'correct-password', {});

    expect(outcome.status).toBe('locked');
    expect(sessions.created).toHaveLength(0);
  });

  it('autentica com sucesso, zera o contador e cria a sessão', async () => {
    const user = await createActiveUser('correct-password');
    user.recordFailedLogin();
    user.recordFailedLogin();
    users.seed(user);

    const outcome = await service.authenticate('ana@hub.com', 'correct-password', {
      ipAddress: '10.0.0.1',
      userAgent: 'jest',
    });

    expect(outcome.status).toBe('ok');
    if (outcome.status !== 'ok') throw new Error('esperava ok');
    expect(outcome.session.accessToken).toMatch(/^mh_session_/);
    expect(sessions.created).toHaveLength(1);
    expect(sessions.created[0].user.failedLoginAttempts).toBe(0);
    expect(sessions.created[0].user.lockedUntil).toBeNull();
  });

  it('retorna invalid quando a conta está suspensa, mesmo com senha correta', async () => {
    const user = await createActiveUser('correct-password');
    user.suspend();
    users.seed(user);

    await expect(service.authenticate('ana@hub.com', 'correct-password', {})).resolves.toEqual({
      status: 'invalid',
    });
  });
});
