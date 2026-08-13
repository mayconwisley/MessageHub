import { ExecutionContext } from '@nestjs/common';
import { Result } from '@shared/result';
import { IMediator } from '@shared/mediator';
import {
  ApiKeyAuthGuard,
  AuthenticatedRequest,
} from '@presentation/http/guards/api-key-auth.guard';
import { InvalidApiKeyError } from '@modules/applications/domain/errors/invalid-api-key.error';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { ApiKeyType } from '@modules/applications/domain/enums/api-key-type.enum';

function createContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyAuthGuard', () => {
  const query = jest.fn();
  const mediator = { query, send: jest.fn() } as unknown as IMediator;
  const guard = new ApiKeyAuthGuard(mediator);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejeita quando não há header Authorization', async () => {
    const request = { headers: {}, ip: '10.0.0.1' } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toMatchObject({ status: 401 });
    expect(query).not.toHaveBeenCalled();
  });

  it('rejeita quando o header não usa o esquema Bearer', async () => {
    const request = {
      headers: { authorization: 'Basic xyz' },
      ip: '10.0.0.1',
    } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toMatchObject({ status: 401 });
    expect(query).not.toHaveBeenCalled();
  });

  it('resolve o authContext e permite acesso quando a chave é válida', async () => {
    const authContext: AuthContextDto = {
      apiKeyId: 'key-1',
      applicationId: 'app-1',
      tenantId: 'tenant-1',
      type: ApiKeyType.TENANT,
    };
    query.mockResolvedValue(Result.ok(authContext));
    const request = {
      headers: { authorization: 'Bearer wh_tenant_live_abc.def' },
      ip: '10.0.0.1',
    } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(request.authContext).toEqual(authContext);
  });

  it('rejeita quando a query de validação falha', async () => {
    query.mockResolvedValue(Result.fail(new InvalidApiKeyError()));
    const request = {
      headers: { authorization: 'Bearer wh_live_abc.def' },
      ip: '10.0.0.1',
    } as unknown as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).rejects.toMatchObject({ status: 401 });
  });
});
