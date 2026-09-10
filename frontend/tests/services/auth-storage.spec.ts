import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../../src/services/auth-storage';

describe('authStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('armazena e recupera o token da sessão', () => {
    authStorage.setSessionToken('sessao-segura');

    expect(authStorage.getSessionToken()).toBe('sessao-segura');
  });

  it('remove o token da sessão', () => {
    authStorage.setSessionToken('sessao-segura');

    authStorage.removeSessionToken();

    expect(authStorage.getSessionToken()).toBeNull();
  });

  it('mantém o perfil na sessão e o remove ao encerrar a sessão', () => {
    authStorage.setSession('sessao-segura', {
      id: 'user-1',
      email: 'operator@example.com',
      role: 'operator',
      tenantId: null,
    });

    expect(authStorage.getSessionUser()).toMatchObject({ role: 'operator' });

    authStorage.removeSessionToken();

    expect(authStorage.getSessionUser()).toBeNull();
  });

  it('preserva token e perfil quando o módulo é recarregado na mesma guia', async () => {
    authStorage.setSession('sessao-segura', {
      id: 'user-1',
      email: 'operator@example.com',
      role: 'operator',
      tenantId: null,
    });

    vi.resetModules();
    const { authStorage: reloadedAuthStorage } = await import('../../src/services/auth-storage');

    expect(reloadedAuthStorage.getSessionToken()).toBe('sessao-segura');
    expect(reloadedAuthStorage.getSessionUser()).toEqual({
      id: 'user-1',
      email: 'operator@example.com',
      role: 'operator',
      tenantId: null,
    });
  });

  it('descarta perfil inválido armazenado na sessão', () => {
    sessionStorage.setItem('message-hub:session-user', '{"role":"invalid"}');

    expect(authStorage.getSessionUser()).toBeNull();
    expect(sessionStorage.getItem('message-hub:session-user')).toBeNull();
  });
});
