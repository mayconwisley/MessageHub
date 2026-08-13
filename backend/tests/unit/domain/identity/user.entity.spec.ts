import { Result } from '@shared/result';
import { User } from '@modules/identity/domain/entities/user.entity';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { InvalidUserNameError } from '@modules/identity/domain/errors/invalid-user-name.error';
import { InvalidUserEmailError } from '@modules/identity/domain/errors/invalid-user-email.error';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure)
    throw new Error(`esperava sucesso, obteve falha: ${JSON.stringify(result.error)}`);
  return result.value;
}

function createUser(): User {
  return expectOk(
    User.create({
      name: 'Ana Admin',
      email: 'ana@hub.com',
      passwordHash: 'hash',
      role: UserRole.PLATFORM_ADMIN,
    }),
  );
}

describe('User', () => {
  it('cria um usuário ativo, sem tentativas falhas nem bloqueio', () => {
    const user = createUser();

    expect(user.isActive()).toBe(true);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
    expect(user.isLocked()).toBe(false);
  });

  it('falha ao criar com nome vazio', () => {
    const result = User.create({
      name: '   ',
      email: 'ana@hub.com',
      passwordHash: 'hash',
      role: UserRole.PLATFORM_ADMIN,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidUserNameError);
  });

  it('falha ao criar com email vazio', () => {
    const result = User.create({
      name: 'Ana',
      email: '   ',
      passwordHash: 'hash',
      role: UserRole.PLATFORM_ADMIN,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidUserEmailError);
  });

  it('suspende e reativa a conta', () => {
    const user = createUser();

    user.suspend();
    expect(user.isActive()).toBe(false);

    user.activate();
    expect(user.isActive()).toBe(true);
  });

  it('incrementa tentativas falhas sem bloquear antes do limite', () => {
    const user = createUser();

    user.recordFailedLogin();
    user.recordFailedLogin();

    expect(user.failedLoginAttempts).toBe(2);
    expect(user.isLocked()).toBe(false);
  });

  it('bloqueia a conta e zera o contador ao atingir 5 tentativas falhas', () => {
    const user = createUser();
    const now = new Date('2026-01-01T00:00:00.000Z');

    for (let i = 0; i < 5; i += 1) user.recordFailedLogin(now);

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toEqual(new Date(now.getTime() + 15 * 60_000));
    expect(user.isLocked(now)).toBe(true);
  });

  it('deixa de estar bloqueada depois que o prazo expira', () => {
    const user = createUser();
    const now = new Date('2026-01-01T00:00:00.000Z');

    for (let i = 0; i < 5; i += 1) user.recordFailedLogin(now);

    const afterLockout = new Date(now.getTime() + 15 * 60_000 + 1);
    expect(user.isLocked(afterLockout)).toBe(false);
  });

  it('zera tentativas e bloqueio ao resetar (ex.: login bem-sucedido)', () => {
    const user = createUser();
    const now = new Date('2026-01-01T00:00:00.000Z');
    for (let i = 0; i < 5; i += 1) user.recordFailedLogin(now);

    user.resetFailedLogin();

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockedUntil).toBeNull();
    expect(user.isLocked(now)).toBe(false);
  });

  it('registra o horário do último login', () => {
    const user = createUser();
    expect(user.lastLoginAt).toBeNull();

    user.recordLogin();

    expect(user.lastLoginAt).not.toBeNull();
  });
});
