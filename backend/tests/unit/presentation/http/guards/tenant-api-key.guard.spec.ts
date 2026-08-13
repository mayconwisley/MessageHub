import { ExecutionContext } from '@nestjs/common';
import { TenantApiKeyGuard } from '@presentation/http/guards/tenant-api-key.guard';
import { ApiKeyType } from '@modules/applications/domain/enums/api-key-type.enum';
import { AuthenticatedRequest } from '@presentation/http/guards/api-key-auth.guard';

function createContext(type?: ApiKeyType): ExecutionContext {
  const request = {
    authContext: type ? { apiKeyId: 'k', applicationId: 'a', tenantId: 't', type } : undefined,
  } as AuthenticatedRequest;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('TenantApiKeyGuard', () => {
  const guard = new TenantApiKeyGuard();

  it('permite quando o authContext é do tipo tenant', () => {
    expect(guard.canActivate(createContext(ApiKeyType.TENANT))).toBe(true);
  });

  it('rejeita quando o authContext é do tipo platform', () => {
    let thrown: unknown;
    try {
      guard.canActivate(createContext(ApiKeyType.PLATFORM));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ status: 401 });
  });

  it('rejeita quando não há authContext (rota sem ApiKeyAuthGuard aplicado antes)', () => {
    let thrown: unknown;
    try {
      guard.canActivate(createContext());
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ status: 401 });
  });
});
