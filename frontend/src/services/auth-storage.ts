const SESSION_TOKEN_KEY = 'message-hub.session-token';

export const authStorage = {
  getSessionToken: () => sessionStorage.getItem(SESSION_TOKEN_KEY),
  setSessionToken: (token: string) => sessionStorage.setItem(SESSION_TOKEN_KEY, token),
  removeSessionToken: () => sessionStorage.removeItem(SESSION_TOKEN_KEY),
};
