import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedRequest } from '../guards/api-key-auth.guard';

export const CurrentAuthContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContextDto => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.authContext) {
      throw new Error('AuthContext not found - is ApiKeyAuthGuard applied to this route?');
    }
    return request.authContext;
  },
);
