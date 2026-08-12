import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { InsufficientPermissionsError } from '@modules/identity/domain/errors';
import { toHttpException } from '../result-http.mapper';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { TenantApiKeyGuard } from './tenant-api-key.guard';
import { UserSessionAuthGuard } from './user-session-auth.guard';

/**
 * Permite suporte administrativo da plataforma, administração do próprio tenant ou API Key tenant.
 * A forma do token determina o fluxo para evitar tentar validar uma API Key como sessão.
 */
@Injectable()
export class PlatformAdminOrTenantApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
    private readonly tenantApiKeyGuard: TenantApiKeyGuard,
    private readonly userSessionAuthGuard: UserSessionAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authorization = request.headers.authorization ?? '';

    if (authorization.startsWith('Bearer wh_')) {
      const isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
      return isAuthenticated && this.tenantApiKeyGuard.canActivate(context);
    }

    await this.userSessionAuthGuard.canActivate(context);

    const user = context
      .switchToHttp()
      .getRequest<{ user?: { role: UserRole; tenantId: string | null } }>().user;
    const isAllowed =
      user?.role === UserRole.PLATFORM_ADMIN ||
      (user?.role === UserRole.TENANT_ADMIN && user.tenantId !== null);
    if (!isAllowed) throw toHttpException(new InsufficientPermissionsError());
    return true;
  }
}
