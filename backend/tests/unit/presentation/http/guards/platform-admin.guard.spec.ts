import { ExecutionContext } from '@nestjs/common';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { UserAuthenticatedRequest } from '@presentation/http/guards/user-session-auth.guard';

function createContext(role?: UserRole): ExecutionContext {
  const request = { user: role ? { role } : undefined } as UserAuthenticatedRequest;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PlatformAdminGuard', () => {
  const guard = new PlatformAdminGuard();

  it('permite quando o usuário é PLATFORM_ADMIN', () => {
    expect(guard.canActivate(createContext(UserRole.PLATFORM_ADMIN))).toBe(true);
  });

  it('rejeita quando o usuário é TENANT_ADMIN', () => {
    let thrown: unknown;
    try {
      guard.canActivate(createContext(UserRole.TENANT_ADMIN));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ status: 403 });
  });

  it('rejeita quando não há usuário autenticado', () => {
    let thrown: unknown;
    try {
      guard.canActivate(createContext());
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toMatchObject({ status: 403 });
  });
});
