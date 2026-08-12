import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { IdentityService } from '@modules/identity/infrastructure/services/identity.service';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';

export interface UserAuthenticatedRequest extends Request {
  user?: AuthenticatedUserDto;
}

@Injectable()
export class UserSessionAuthGuard implements CanActivate {
  constructor(private readonly identityService: IdentityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserAuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const user = token ? await this.identityService.resolveSession(token) : null;
    if (!user) return false;
    request.user = user;
    return true;
  }
}
