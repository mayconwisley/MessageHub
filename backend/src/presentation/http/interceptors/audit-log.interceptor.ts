import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Observable, from } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AuditLogService } from '@modules/audit/infrastructure/services/audit-log.service';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedRequest } from '../guards/api-key-auth.guard';
import { UserAuthenticatedRequest } from '../guards/user-session-auth.guard';

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

type AuditableRequest = UserAuthenticatedRequest & AuthenticatedRequest;

/** Registra mutações administrativas (sessão OU API Key) e também tentativas negadas/falhas (secao 26/27). */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditableRequest>();
    if (!this.hasActor(request) || !AUDITED_METHODS.includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (response: unknown) => {
        await this.record(context, request, response, this.resolveSuccessStatus(context, request));
        return response;
      }),
      catchError((error: unknown) => from(this.recordFailureAndRethrow(context, request, error))),
    );
  }

  private hasActor(request: AuditableRequest): boolean {
    return Boolean(request.user) || Boolean(request.authContext);
  }

  private resolveSuccessStatus(context: ExecutionContext, request: AuditableRequest): number {
    const explicit: unknown = Reflect.getMetadata(HTTP_CODE_METADATA, context.getHandler());
    if (typeof explicit === 'number') return explicit;
    return request.method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK;
  }

  private async recordFailureAndRethrow(
    context: ExecutionContext,
    request: AuditableRequest,
    error: unknown,
  ): Promise<never> {
    const httpStatus =
      error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    await this.record(context, request, undefined, httpStatus);
    throw error;
  }

  private async record(
    context: ExecutionContext,
    request: AuditableRequest,
    response: unknown,
    httpStatus: number,
  ): Promise<void> {
    const resource = response as { id?: string; tenantId?: string } | undefined;
    const route: unknown = request.route;
    const routePath =
      typeof route === 'object' &&
      route !== null &&
      'path' in route &&
      typeof route.path === 'string'
        ? route.path
        : request.path;
    const requestId = typeof request.id === 'string' ? request.id : null;
    const controllerPath: unknown = Reflect.getMetadata(PATH_METADATA, context.getClass());
    const resourceType =
      typeof controllerPath === 'string'
        ? controllerPath.split('/').filter(Boolean).pop()
        : undefined;
    const authContext: AuthContextDto | undefined = request.authContext;

    await this.auditLogService.record({
      actorUserId: request.user?.id ?? null,
      actorEmail: request.user?.email ?? null,
      action: `${request.method} ${routePath}`,
      resourceType: resourceType ?? 'unknown',
      resourceId: resource?.id ?? null,
      tenantId: resource?.tenantId ?? request.user?.tenantId ?? authContext?.tenantId ?? null,
      requestId,
      httpMethod: request.method,
      // Query strings podem conter dados sensíveis enviados por engano;
      // a trilha é suficiente para fins de auditoria.
      httpPath: request.path.slice(0, 2048),
      httpStatus,
      metadata: {
        role: request.user?.role,
        apiKeyId: authContext?.apiKeyId,
        applicationId: authContext?.applicationId,
        authType: request.user ? 'session' : 'api_key',
      },
    });
  }
}
