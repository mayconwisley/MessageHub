import { request } from '../../services/http-client';

export interface Session {
  accessToken: string;
  expiresAt: string;
  user: { id: string; email: string; role: string; tenantId?: string | null };
}
export const login = (data: { email: string; password: string }) =>
  request<Session>('/v1/auth/sessions', { method: 'POST', body: data, authorization: 'none' });
export const logout = () => request<void>('/v1/auth/sessions', { method: 'DELETE' });
