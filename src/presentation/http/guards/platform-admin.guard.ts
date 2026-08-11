import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { UserAuthenticatedRequest } from './user-session-auth.guard';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<UserAuthenticatedRequest>();
    return request.user?.role === UserRole.PLATFORM_ADMIN;
  }
}
