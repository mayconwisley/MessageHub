import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { InsufficientPermissionsError } from '@modules/identity/domain/errors';
import { toHttpException } from '../result-http.mapper';
import { UserAuthenticatedRequest } from './user-session-auth.guard';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<UserAuthenticatedRequest>();
    if (request.user?.role !== UserRole.PLATFORM_ADMIN) {
      throw toHttpException(new InsufficientPermissionsError());
    }
    return true;
  }
}
