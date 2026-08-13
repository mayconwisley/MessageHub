import { ExecutionContext } from '@nestjs/common';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import {
  UserAuthenticatedRequest,
  UserSessionAuthGuard,
} from '@presentation/http/guards/user-session-auth.guard';

function createContext(authorization?: string): ExecutionContext {
  const request = { headers: { authorization } } as UserAuthenticatedRequest;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('UserSessionAuthGuard', () => {
  const resolveSession = jest.fn();
  const sessions = { resolveSession } as unknown as UserSessionService;
  const guard = new UserSessionAuthGuard(sessions);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejeita quando não há header Authorization', async () => {
    await expect(guard.canActivate(createContext())).rejects.toMatchObject({ status: 401 });
    expect(resolveSession).not.toHaveBeenCalled();
  });

  it('rejeita quando o header não usa o esquema Bearer', async () => {
    await expect(guard.canActivate(createContext('Basic xyz'))).rejects.toMatchObject({
      status: 401,
    });
    expect(resolveSession).not.toHaveBeenCalled();
  });

  it('rejeita quando a sessão não resolve para um usuário', async () => {
    resolveSession.mockResolvedValue(null);

    await expect(guard.canActivate(createContext('Bearer mh_session_abc'))).rejects.toMatchObject({
      status: 401,
    });
    expect(resolveSession).toHaveBeenCalledWith('mh_session_abc');
  });

  it('define request.user e permite acesso quando a sessão é válida', async () => {
    const user = { id: 'u1', email: 'a@b.com', role: UserRole.TENANT_ADMIN, tenantId: 't1' };
    resolveSession.mockResolvedValue(user);
    const context = createContext('Bearer mh_session_abc');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(context.switchToHttp().getRequest<UserAuthenticatedRequest>().user).toEqual(user);
  });
});
