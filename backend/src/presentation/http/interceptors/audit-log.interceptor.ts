import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuditLogService } from '@modules/audit/infrastructure/services/audit-log.service';
import { UserAuthenticatedRequest } from '../guards/user-session-auth.guard';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<UserAuthenticatedRequest>();
    if (!request.user || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap(async (response: unknown) => {
        const resource = response as { id?: string; tenantId?: string };
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
        await this.auditLogService.record({
          actorUserId: request.user?.id ?? null,
          actorEmail: request.user?.email ?? null,
          action: `${request.method} ${routePath}`,
          resourceType: resourceType ?? 'unknown',
          resourceId: resource?.id ?? null,
          tenantId: resource?.tenantId ?? request.user?.tenantId ?? null,
          requestId,
          httpMethod: request.method,
          // Query strings podem conter dados sensíveis enviados por engano;
          // a trilha é suficiente para fins de auditoria.
          httpPath: request.path.slice(0, 2048),
          httpStatus: 200,
          metadata: { role: request.user?.role },
        });
        return response;
      }),
    );
  }
}
