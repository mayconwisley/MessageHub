export type UserRole = 'platform_admin' | 'tenant_admin' | 'operator';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

const SESSION_TOKEN_KEY = 'message-hub:session-token';
const SESSION_USER_KEY = 'message-hub:session-user';

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'platform_admin' || value === 'tenant_admin' || value === 'operator';
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.email === 'string' &&
    isUserRole(candidate.role) &&
    (candidate.tenantId === undefined ||
      candidate.tenantId === null ||
      typeof candidate.tenantId === 'string')
  );
}

function readSessionUser(storage: Storage): SessionUser | null {
  const serializedUser = storage.getItem(SESSION_USER_KEY);
  if (!serializedUser) return null;

  try {
    const user: unknown = JSON.parse(serializedUser);
    if (isSessionUser(user)) return user;
  } catch {
    // O valor inválido é removido abaixo para não contaminar as próximas leituras.
  }

  storage.removeItem(SESSION_USER_KEY);
  return null;
}

export const authStorage = {
  /**
   * O sessionStorage preserva a autenticação em recargas da mesma guia e a remove
   * automaticamente quando a guia ou o navegador é encerrado.
   */
  getSessionToken: () => getSessionStorage()?.getItem(SESSION_TOKEN_KEY) ?? null,
  setSessionToken: (token: string) => {
    getSessionStorage()?.setItem(SESSION_TOKEN_KEY, token);
  },
  getSessionUser: () => {
    const storage = getSessionStorage();
    return storage ? readSessionUser(storage) : null;
  },
  setSession: (token: string, user: SessionUser) => {
    const storage = getSessionStorage();
    if (!storage) return;

    storage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    storage.setItem(SESSION_TOKEN_KEY, token);
  },
  removeSessionToken: () => {
    const storage = getSessionStorage();
    storage?.removeItem(SESSION_TOKEN_KEY);
    storage?.removeItem(SESSION_USER_KEY);
  },
};
