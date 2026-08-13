import { LogoutHandler } from '@modules/identity/application/handlers/logout.handler';
import { LogoutCommand } from '@modules/identity/application/commands/logout.command';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';

describe('LogoutHandler', () => {
  const revokeSession = jest.fn().mockResolvedValue(undefined);
  const sessions = { revokeSession } as unknown as UserSessionService;
  const handler = new LogoutHandler(sessions);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('revoga a sessão quando há token', async () => {
    const result = await handler.execute(new LogoutCommand('mh_session_abc'));

    expect(revokeSession).toHaveBeenCalledWith('mh_session_abc');
    expect(result.isSuccess).toBe(true);
  });

  it('não chama revogação quando não há token, mas retorna sucesso', async () => {
    const result = await handler.execute(new LogoutCommand(undefined));

    expect(revokeSession).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
  });
});
