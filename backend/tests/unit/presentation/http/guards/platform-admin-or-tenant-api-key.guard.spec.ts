import { ExecutionContext } from '@nestjs/common';
import { PlatformAdminOrTenantApiKeyGuard } from '@presentation/http/guards/platform-admin-or-tenant-api-key.guard';
import { ApiKeyAuthGuard } from '@presentation/http/guards/api-key-auth.guard';
import { TenantApiKeyGuard } from '@presentation/http/guards/tenant-api-key.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';

function createContext(
  authorization?: string,
  user?: { role: UserRole; tenantId: string | null },
): ExecutionContext {
  const request = { headers: { authorization }, user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PlatformAdminOrTenantApiKeyGuard', () => {
  const apiKeyCanActivate = jest.fn();
  const tenantApiKeyCanActivate = jest.fn();
  const userSessionCanActivate = jest.fn();
  const apiKeyAuthGuard = { canActivate: apiKeyCanActivate } as unknown as ApiKeyAuthGuard;
  const tenantApiKeyGuard = {
    canActivate: tenantApiKeyCanActivate,
  } as unknown as TenantApiKeyGuard;
  const userSessionAuthGuard = {
    canActivate: userSessionCanActivate,
  } as unknown as UserSessionAuthGuard;
  const guard = new PlatformAdminOrTenantApiKeyGuard(
    apiKeyAuthGuard,
    tenantApiKeyGuard,
    userSessionAuthGuard,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aceita API key tenant (delega para ApiKeyAuthGuard + TenantApiKeyGuard)', async () => {
    apiKeyCanActivate.mockResolvedValue(true);
    tenantApiKeyCanActivate.mockReturnValue(true);

    await expect(guard.canActivate(createContext('Bearer wh_tenant_live_abc.def'))).resolves.toBe(
      true,
    );

    expect(apiKeyCanActivate).toHaveBeenCalledTimes(1);
    expect(tenantApiKeyCanActivate).toHaveBeenCalledTimes(1);
    expect(userSessionCanActivate).not.toHaveBeenCalled();
  });

  it('rejeita API key quando não é do tipo tenant', async () => {
    apiKeyCanActivate.mockResolvedValue(true);
    tenantApiKeyCanActivate.mockReturnValue(false);

    await expect(guard.canActivate(createContext('Bearer wh_live_abc.def'))).resolves.toBe(false);
  });

  it('aceita sessão de administrador da plataforma', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext('Bearer mh_session', { role: UserRole.PLATFORM_ADMIN, tenantId: null }),
      ),
    ).resolves.toBe(true);
  });

  it('aceita sessão de administrador de tenant com tenantId definido', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext('Bearer mh_session', { role: UserRole.TENANT_ADMIN, tenantId: 't1' }),
      ),
    ).resolves.toBe(true);
  });

  it('rejeita administrador de tenant sem tenantId', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext('Bearer mh_session', { role: UserRole.TENANT_ADMIN, tenantId: null }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejeita outros papéis de sessão', async () => {
    userSessionCanActivate.mockResolvedValue(true);

    await expect(
      guard.canActivate(
        createContext('Bearer mh_session', { role: UserRole.OPERATOR, tenantId: 't1' }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
