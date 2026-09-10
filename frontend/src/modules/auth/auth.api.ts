import { request } from '../../services/http-client';
import type { SessionUser } from '../../services/auth-storage';

export interface Session {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}
export const login = (data: { email: string; password: string }) =>
  request<Session>('/v1/auth/sessions', { method: 'POST', body: data, authorization: 'none' });
export const refreshSession = () => request<void>('/v1/auth/sessions/refresh', { method: 'POST' });
export const logout = () => request<void>('/v1/auth/sessions', { method: 'DELETE' });
