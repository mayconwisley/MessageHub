import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult, SortDirection } from '../../services/pagination';

export interface WhatsAppAccount {
  id: string;
  tenantId: string;
  wabaId: string;
  credentialSource: 'default' | 'tenant';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  [key: string]: unknown;
}

export interface DefaultChannel {
  enabled: boolean;
  wabaId: string | null;
}

export const whatsAppAccountsApi = {
  list: (params: {
    tenantId: string;
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDirection?: SortDirection;
  }) => request<PaginatedResult<WhatsAppAccount>>(`/v1/whatsapp-accounts${toQueryString(params)}`),
  create: (data: {
    tenantId: string;
    wabaId: string;
    credentialSource: string;
    accessToken?: string;
    appSecret?: string;
  }) => request<WhatsAppAccount>('/v1/whatsapp-accounts', { method: 'POST', body: data }),
  getById: (id: string) => request<WhatsAppAccount>(`/v1/whatsapp-accounts/${id}`),
  getDefaultChannel: () => request<DefaultChannel>('/v1/whatsapp-accounts/default-channel'),
  ensureDefaultChannel: (tenantId: string) =>
    request<WhatsAppAccount>('/v1/whatsapp-accounts/default-channel/ensure', {
      method: 'POST',
      body: { tenantId },
    }),
};
