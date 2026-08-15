import { afterEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../../src/services/auth-storage';
import { request, toQueryString } from '../../src/services/http-client';

describe('toQueryString', () => {
  it('serializa apenas valores definidos e não vazios', () => {
    expect(toQueryString({ tenantId: 'tenant 1', page: 2, status: undefined, empty: '' })).toBe(
      '?tenantId=tenant+1&page=2',
    );
  });
});

describe('request', () => {
  afterEach(() => {
    authStorage.removeSessionToken();
    vi.unstubAllGlobals();
  });

  it('envia token de sessão e corpo JSON sem credenciais do navegador', async () => {
    authStorage.setSessionToken('token-seguro');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 'message-1' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      request<{ id: string }>('/v1/messages', { method: 'POST', body: { to: '5511999999999' } }),
    ).resolves.toEqual({
      id: 'message-1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/v1\/messages$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ to: '5511999999999' }),
        credentials: 'omit',
        cache: 'no-store',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-seguro',
        }),
      }),
    );
  });

  it('não envia token quando a autorização é desabilitada', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    await request('/v1/login', { authorization: 'none' });

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('converte a resposta de erro da API em ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: ['Campo inválido', 'Tente novamente'],
            code: 'VALIDATION_ERROR',
            requestId: 'req-1',
          }),
          {
            status: 400,
          },
        ),
      ),
    );

    await expect(request('/v1/messages')).rejects.toMatchObject({
      message: 'Campo inválido Tente novamente',
      status: 400,
      code: 'VALIDATION_ERROR',
      requestId: 'req-1',
    });
  });

  it('retorna undefined para respostas sem conteúdo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(
      request<void>('/v1/messages/message-1', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('retorna undefined para respostas aceitas sem corpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));

    await expect(
      request<void>('/v1/sandbox/messages/message-1/status', { method: 'POST' }),
    ).resolves.toBeUndefined();
  });
});
