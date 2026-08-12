import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserAuthenticatedRequest } from '../guards/user-session-auth.guard';

export const CurrentAuthenticatedUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserDto | undefined => {
    return ctx.switchToHttp().getRequest<UserAuthenticatedRequest>().user;
  },
);
