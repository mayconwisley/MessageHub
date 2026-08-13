import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { InsufficientPermissionsError } from '@modules/identity/domain/errors';
import { toHttpException } from '../result-http.mapper';
import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { UserSessionAuthGuard } from './user-session-auth.guard';

/** Permite operações de aplicação por API Key ou por administração da plataforma. */
@Injectable()
export class PlatformAdminOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyAuthGuard: ApiKeyAuthGuard,
    private readonly userSessionAuthGuard: UserSessionAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authorization = request.headers.authorization ?? '';

    if (authorization.startsWith('Bearer wh_')) {
      return this.apiKeyAuthGuard.canActivate(context);
    }

    await this.userSessionAuthGuard.canActivate(context);
    const user = context.switchToHttp().getRequest<{ user?: { role: UserRole } }>().user;
    if (user?.role !== UserRole.PLATFORM_ADMIN) {
      throw toHttpException(new InsufficientPermissionsError());
    }
    return true;
  }
}
