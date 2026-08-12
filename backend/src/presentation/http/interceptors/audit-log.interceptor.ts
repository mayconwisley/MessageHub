import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
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
        await this.auditLogService.record({
          actorUserId: request.user?.id ?? null,
          actorEmail: request.user?.email ?? null,
          action: `${request.method} ${request.route?.path ?? request.path}`,
          resourceType: request.baseUrl.split('/').filter(Boolean).pop() ?? 'unknown',
          resourceId: resource?.id ?? null,
          tenantId: resource?.tenantId ?? request.user?.tenantId ?? null,
          requestId: request.id ? String(request.id) : null,
          httpMethod: request.method,
          httpPath: request.originalUrl,
          httpStatus: 200,
          metadata: { role: request.user?.role },
        });
        return response;
      }),
    );
  }
}
