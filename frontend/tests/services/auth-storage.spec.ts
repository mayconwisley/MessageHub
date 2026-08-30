import { beforeEach, describe, expect, it } from 'vitest';
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

  it('mantém o perfil apenas em memória e o remove ao encerrar a sessão', () => {
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
});
