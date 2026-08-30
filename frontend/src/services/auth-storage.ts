let sessionToken: string | null = null;

export const authStorage = {
  /**
   * O token administrativo não é persistido em Web Storage. Isso reduz a janela
   * de exfiltração em caso de XSS e exige nova autenticação após recarregar a aba.
   */
  getSessionToken: () => sessionToken,
  setSessionToken: (token: string) => {
    sessionToken = token;
  },
  removeSessionToken: () => {
    sessionToken = null;
  },
};
