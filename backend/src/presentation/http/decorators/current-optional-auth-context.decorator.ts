import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedRequest } from '../guards/api-key-auth.guard';

/** Retorna o contexto somente quando a rota foi autenticada por API Key. */
export const CurrentOptionalAuthContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContextDto | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.authContext;
  },
);
