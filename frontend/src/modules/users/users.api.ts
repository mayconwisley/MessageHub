import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface User {
  id: string;
  tenantId: string | null;
  tenantName?: string | null;
  name: string;
  email: string;
  role: 'platform_admin' | 'tenant_admin' | 'operator';
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  [key: string]: unknown;
}

export const usersApi = {
  list: (params: {
    page: number;
    pageSize: number;
    tenantId?: string;
    role?: string;
    status?: string;
    search?: string;
  }) => request<PaginatedResult<User>>(`/v1/users${toQueryString(params)}`),
  create: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    tenantId?: string;
  }) => request<User>('/v1/users', { method: 'POST', body: data }),
  getById: (id: string) => request<User>(`/v1/users/${id}`),
  update: (
    id: string,
    data: { name?: string; email?: string; role?: string; tenantId?: string },
  ) => request<User>(`/v1/users/${id}`, { method: 'PATCH', body: data }),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    request<User>(`/v1/users/${id}/status`, { method: 'PATCH', body: { status } }),
};
