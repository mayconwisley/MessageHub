const SESSION_TOKEN_KEY = 'message-hub.session-token';
const API_KEY_KEY = 'message-hub.api-key';

export const authStorage = {
  getSessionToken: () => sessionStorage.getItem(SESSION_TOKEN_KEY),
  setSessionToken: (token: string) => sessionStorage.setItem(SESSION_TOKEN_KEY, token),
  removeSessionToken: () => sessionStorage.removeItem(SESSION_TOKEN_KEY),
  getApiKey: () => sessionStorage.getItem(API_KEY_KEY),
  setApiKey: (key: string) => sessionStorage.setItem(API_KEY_KEY, key),
  removeApiKey: () => sessionStorage.removeItem(API_KEY_KEY),
};
