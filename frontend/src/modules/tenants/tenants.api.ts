import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface Tenant {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  [key: string]: unknown;
}

export const tenantsApi = {
  list: (params: { page: number; pageSize: number; status?: string; search?: string }) =>
    request<PaginatedResult<Tenant>>(`/v1/tenants${toQueryString(params)}`),
  create: (data: { name: string }) =>
    request<Tenant>('/v1/tenants', { method: 'POST', body: data }),
  getById: (id: string) => request<Tenant>(`/v1/tenants/${id}`),
  updateStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED') =>
    request<Tenant>(`/v1/tenants/${id}/status`, { method: 'PATCH', body: { status } }),
};
