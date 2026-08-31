let sessionToken: string | null = null;
export type UserRole = 'platform_admin' | 'tenant_admin' | 'operator';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId?: string | null;
}

let sessionUser: SessionUser | null = null;

export const authStorage = {
  /**
   * O token administrativo não é persistido em Web Storage. Isso reduz a janela
   * de exfiltração em caso de XSS e exige nova autenticação após recarregar a aba.
   */
  getSessionToken: () => sessionToken,
  setSessionToken: (token: string) => {
    sessionToken = token;
  },
  getSessionUser: () => sessionUser,
  setSession: (token: string, user: SessionUser) => {
    sessionToken = token;
    sessionUser = user;
  },
  removeSessionToken: () => {
    sessionToken = null;
    sessionUser = null;
  },
};
