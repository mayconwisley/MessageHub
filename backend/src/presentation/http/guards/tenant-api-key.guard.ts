import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiKeyType } from '@modules/applications/domain/enums/api-key-type.enum';
import { InvalidApiKeyError } from '@modules/applications/domain/errors/invalid-api-key.error';
import { toHttpException } from '../result-http.mapper';
import { AuthenticatedRequest } from './api-key-auth.guard';

/** Restringe operações de gestão ao tenant titular da API Key. */
@Injectable()
export class TenantApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.authContext?.type !== ApiKeyType.TENANT) {
      throw toHttpException(new InvalidApiKeyError());
    }
    return true;
  }
}
