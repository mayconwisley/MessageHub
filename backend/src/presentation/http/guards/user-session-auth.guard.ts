import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { InvalidSessionError } from '@modules/identity/domain/errors';
import { toHttpException } from '../result-http.mapper';

export interface UserAuthenticatedRequest extends Request {
  user?: AuthenticatedUserDto;
}

@Injectable()
export class UserSessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: UserSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<UserAuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const user = token ? await this.sessions.resolveSession(token) : null;
    if (!user) throw toHttpException(new InvalidSessionError());
    request.user = user;
    return true;
  }
}
