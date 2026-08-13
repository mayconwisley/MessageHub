import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface PhoneNumber {
  id: string;
  whatsAppAccountId: string;
  phoneNumberId: string;
  displayNumber: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  [key: string]: unknown;
}

export const phoneNumbersApi = {
  list: (params: {
    tenantId: string;
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }) => request<PaginatedResult<PhoneNumber>>(`/v1/phone-numbers${toQueryString(params)}`),
  create: (data: { whatsAppAccountId: string; phoneNumberId: string; displayNumber: string }) =>
    request<PhoneNumber>('/v1/phone-numbers', { method: 'POST', body: data }),
  getById: (id: string) => request<PhoneNumber>(`/v1/phone-numbers/${id}`),
};
