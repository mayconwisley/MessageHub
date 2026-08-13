import { ExecutionContext } from '@nestjs/common';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { ApiKeyAuthGuard } from '@presentation/http/guards/api-key-auth.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';

function createContext(authorization?: string, role?: UserRole): ExecutionContext {
  const request = { headers: { authorization }, user: role ? { role } : undefined };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PlatformAdminOrApiKeyGuard', () => {
  const apiKeyCanActivate = jest.fn();
  const userSessionCanActivate = jest.fn();
  const apiKeyAuthGuard = { canActivate: apiKeyCanActivate } as unknown as ApiKeyAuthGuard;
  const userSessionAuthGuard = {
    canActivate: userSessionCanActivate,
  } as unknown as UserSessionAuthGuard;
  const guard = new PlatformAdminOrApiKeyGuard(apiKeyAuthGuard, userSessionAuthGuard);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aceita API key de aplicação sem exigir tipo tenant', async () => {
    apiKeyCanActivate.mockResolvedValue(true);

    await expect(guard.canActivate(createContext('Bearer wh_live_application-key'))).resolves.toBe(
      true,
    );

    expect(apiKeyCanActivate).toHaveBeenCalledTimes(1);
    expect(userSessionCanActivate).not.toHaveBeenCalled();
  });

  it('aceita sessão de administrador da plataforma', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(createContext('Bearer mh_session', UserRole.PLATFORM_ADMIN)),
    ).resolves.toBe(true);
  });

  it('rejeita sessão que não seja de administrador da plataforma', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(createContext('Bearer mh_session', UserRole.TENANT_ADMIN)),
    ).rejects.toMatchObject({
      status: 403,
    });
  });
});
