import { LoginHandler } from '@modules/identity/application/handlers/login.handler';
import { LoginCommand } from '@modules/identity/application/commands/login.command';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';
import { AccountLockedError } from '@modules/identity/domain/errors/account-locked.error';
import { InvalidCredentialsError } from '@modules/identity/domain/errors/invalid-credentials.error';

describe('LoginHandler', () => {
  const authenticate = jest.fn();
  const sessions = { authenticate } as unknown as UserSessionService;
  const handler = new LoginHandler(sessions);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna sucesso quando a autenticação resulta em ok', async () => {
    const session = { accessToken: 'mh_session_x', expiresAt: new Date(), user: {} } as never;
    authenticate.mockResolvedValue({ status: 'ok', session });

    const result = await handler.execute(new LoginCommand('a@b.com', 'pwd'));

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(session);
  });

  it('retorna InvalidCredentialsError quando a autenticação é invalid', async () => {
    authenticate.mockResolvedValue({ status: 'invalid' });

    const result = await handler.execute(new LoginCommand('a@b.com', 'pwd'));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidCredentialsError);
  });

  it('retorna AccountLockedError quando a conta está bloqueada', async () => {
    const lockedUntil = new Date('2026-01-01T00:15:00.000Z');
    authenticate.mockResolvedValue({ status: 'locked', lockedUntil });

    const result = await handler.execute(new LoginCommand('a@b.com', 'pwd'));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(AccountLockedError);
    expect((result.error as AccountLockedError).lockedUntil).toBe(lockedUntil);
  });
});
