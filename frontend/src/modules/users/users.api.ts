import { request } from '../../services/http-client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'platform_admin' | 'tenant_admin' | 'operator';
  tenantId?: string;
  [key: string]: unknown;
}

export const usersApi = {
  create: (data: { name: string; email: string; password: string; role: string; tenantId?: string }) =>
    request<User>('/v1/users', { method: 'POST', body: data }),
};
