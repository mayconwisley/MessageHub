import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { API_KEY_AUTH_SCHEME } from '@shared/constants';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { InvalidApiKeyError } from '@modules/applications/domain/errors/invalid-api-key.error';
import { ValidateApiKeyQuery } from '@modules/applications/application/queries/validate-api-key.query';
import { toHttpException } from '../result-http.mapper';

export interface AuthenticatedRequest extends Request {
  authContext?: AuthContextDto;
}

/** Resolve `Authorization: Bearer wh_live_...` para o contexto Tenant/Application/ApiKey (secao 17/18). */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith(`${API_KEY_AUTH_SCHEME} `)) {
      throw toHttpException(new InvalidApiKeyError());
    }

    const plainTextKey = header.slice(API_KEY_AUTH_SCHEME.length + 1);
    const result = await this.mediator.query(new ValidateApiKeyQuery(plainTextKey));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }

    request.authContext = result.value;
    return true;
  }
}
