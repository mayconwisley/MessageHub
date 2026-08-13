import 'reflect-metadata';
import { CallHandler, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuditLogInterceptor } from '@presentation/http/interceptors/audit-log.interceptor';
import { AuditLogService } from '@modules/audit/infrastructure/services/audit-log.service';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { ApiKeyType } from '@modules/applications/domain/enums/api-key-type.enum';

class DummyController {}

interface TestRequest {
  method: string;
  path: string;
  route?: { path: string };
  id?: string;
  user?: { id: string; email: string; role: UserRole; tenantId: string | null };
  authContext?: { apiKeyId: string; applicationId: string; tenantId: string; type: ApiKeyType };
}

function createContext(
  request: TestRequest,
  handler: () => void = function handler() {},
): ExecutionContext {
  Reflect.defineMetadata(PATH_METADATA, 'v1/messages', DummyController);
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getClass: () => DummyController,
    getHandler: () => handler,
  } as unknown as ExecutionContext;
}

function createCallHandler(result: unknown): CallHandler {
  return { handle: () => of(result) };
}

function createFailingCallHandler(error: unknown): CallHandler {
  return { handle: () => throwError(() => error) };
}

describe('AuditLogInterceptor', () => {
  const record = jest.fn().mockResolvedValue(undefined);
  const auditLogService = { record } as unknown as AuditLogService;
  const interceptor = new AuditLogInterceptor(auditLogService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não grava requisições GET, mesmo com usuário autenticado', async () => {
    const request: TestRequest = {
      method: 'GET',
      path: '/v1/messages',
      user: { id: 'u1', email: 'a@b.com', role: UserRole.PLATFORM_ADMIN, tenantId: null },
    };
    const context = createContext(request);

    await firstValueFrom(interceptor.intercept(context, createCallHandler({ id: 'm1' })));

    expect(record).not.toHaveBeenCalled();
  });

  it('não grava mutações sem ator (nem sessão nem API Key)', async () => {
    const request: TestRequest = { method: 'POST', path: '/v1/messages' };
    const context = createContext(request);

    await firstValueFrom(interceptor.intercept(context, createCallHandler({ id: 'm1' })));

    expect(record).not.toHaveBeenCalled();
  });

  it('grava mutação autenticada por sessão com status default de POST (201)', async () => {
    const request: TestRequest = {
      method: 'POST',
      path: '/v1/messages',
      id: 'req-1',
      user: { id: 'u1', email: 'admin@hub.com', role: UserRole.PLATFORM_ADMIN, tenantId: null },
    };
    const context = createContext(request);

    await firstValueFrom(
      interceptor.intercept(context, createCallHandler({ id: 'm1', tenantId: 't1' })),
    );

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        actorEmail: 'admin@hub.com',
        action: 'POST /v1/messages',
        resourceType: 'messages',
        resourceId: 'm1',
        tenantId: 't1',
        requestId: 'req-1',
        httpStatus: HttpStatus.CREATED,
        metadata: expect.objectContaining({ role: UserRole.PLATFORM_ADMIN, authType: 'session' }),
      }),
    );
  });

  it('grava mutação autenticada por API Key, identificando a origem em metadata', async () => {
    const request: TestRequest = {
      method: 'DELETE',
      path: '/v1/applications/app-1/api-keys/key-1',
      authContext: {
        apiKeyId: 'key-1',
        applicationId: 'app-1',
        tenantId: 'tenant-1',
        type: ApiKeyType.TENANT,
      },
    };
    const context = createContext(request);

    await firstValueFrom(interceptor.intercept(context, createCallHandler(undefined)));

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: null,
        actorEmail: null,
        tenantId: 'tenant-1',
        httpStatus: HttpStatus.OK,
        metadata: expect.objectContaining({
          apiKeyId: 'key-1',
          applicationId: 'app-1',
          authType: 'api_key',
        }),
      }),
    );
  });

  it('usa o status explícito de @HttpCode quando presente', async () => {
    const handler = function handler() {};
    Reflect.defineMetadata(HTTP_CODE_METADATA, HttpStatus.NO_CONTENT, handler);
    const request: TestRequest = {
      method: 'DELETE',
      path: '/v1/templates/t1',
      user: { id: 'u1', email: 'admin@hub.com', role: UserRole.PLATFORM_ADMIN, tenantId: null },
    };
    const context = createContext(request, handler);

    await firstValueFrom(interceptor.intercept(context, createCallHandler(undefined)));

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ httpStatus: HttpStatus.NO_CONTENT }),
    );
  });

  it('também registra tentativas negadas/falhas, preservando o erro original', async () => {
    const request: TestRequest = {
      method: 'POST',
      path: '/v1/tenants',
      user: { id: 'u1', email: 'admin@hub.com', role: UserRole.TENANT_ADMIN, tenantId: 't1' },
    };
    const context = createContext(request);
    const error = new HttpException({ code: 'INSUFFICIENT_PERMISSIONS' }, HttpStatus.FORBIDDEN);

    await expect(
      firstValueFrom(interceptor.intercept(context, createFailingCallHandler(error))),
    ).rejects.toBe(error);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ httpStatus: HttpStatus.FORBIDDEN }),
    );
  });

  it('usa 500 para falhas que não são HttpException', async () => {
    const request: TestRequest = {
      method: 'POST',
      path: '/v1/tenants',
      user: { id: 'u1', email: 'admin@hub.com', role: UserRole.PLATFORM_ADMIN, tenantId: null },
    };
    const context = createContext(request);
    const error = new Error('falha inesperada');

    await expect(
      firstValueFrom(interceptor.intercept(context, createFailingCallHandler(error))),
    ).rejects.toBe(error);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ httpStatus: HttpStatus.INTERNAL_SERVER_ERROR }),
    );
  });
});
