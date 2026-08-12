import { request } from '../../services/http-client';

export interface Session { token: string; expiresAt: string; user: { id: string; name: string; email: string; role: string; tenantId?: string }; }
export const login = (data: { email: string; password: string }) => request<Session>('/v1/auth/sessions', { method: 'POST', body: data, authorization: 'none' });
