import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
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
    private readonly platformAdminGuard: PlatformAdminGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authorization = request.headers.authorization ?? '';

    if (authorization.startsWith('Bearer wh_')) {
      const isAuthenticated = await this.apiKeyAuthGuard.canActivate(context);
      return isAuthenticated && this.tenantApiKeyGuard.canActivate(context);
    }

    const isAuthenticated = await this.userSessionAuthGuard.canActivate(context);
    if (!isAuthenticated) return false;

    if (this.platformAdminGuard.canActivate(context)) return true;
    const user = context.switchToHttp().getRequest<{ user?: { role: UserRole; tenantId: string | null } }>().user;
    return user?.role === UserRole.TENANT_ADMIN && user.tenantId !== null;
  }
}
