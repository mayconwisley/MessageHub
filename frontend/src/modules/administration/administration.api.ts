import { request } from '../../services/http-client';

export interface Entity { id: string; status: string; createdAt: string; [key: string]: unknown }
export interface PaginatedEntities { items: Entity[]; total: number; page: number; pageSize: number }
export const administrationApi = {
  listTenants: () => request<PaginatedEntities>('/v1/tenants'),
  createTenant: (name: string) => request<Entity>('/v1/tenants', { method: 'POST', body: { name } }),
  getTenant: (id: string) => request<Entity>(`/v1/tenants/${id}`),
  createApplication: (data: { tenantId: string; name: string }) => request<Entity>('/v1/applications', { method: 'POST', body: data }),
  listApplications: (tenantId: string) => request<PaginatedEntities>(`/v1/applications?tenantId=${encodeURIComponent(tenantId)}`),
  createAccount: (data: Record<string, string>) => request<Entity>('/v1/whatsapp-accounts', { method: 'POST', body: data }),
  listAccounts: (tenantId: string) => request<PaginatedEntities>(`/v1/whatsapp-accounts?tenantId=${encodeURIComponent(tenantId)}`),
  getAccount: (id: string) => request<Entity>(`/v1/whatsapp-accounts/${id}`),
  createPhoneNumber: (data: { whatsAppAccountId: string; phoneNumberId: string; displayNumber: string }) => request<Entity>('/v1/phone-numbers', { method: 'POST', body: data }),
  listPhoneNumbers: (tenantId: string) => request<PaginatedEntities>(`/v1/phone-numbers?tenantId=${encodeURIComponent(tenantId)}`),
  getPhoneNumber: (id: string) => request<Entity>(`/v1/phone-numbers/${id}`),
  createApiKey: (applicationId: string, data: { type: string; expiresAt?: string }) => request<Entity & { plainTextKey: string }>(`/v1/applications/${applicationId}/api-keys`, { method: 'POST', body: data }),
  revokeApiKey: (applicationId: string, apiKeyId: string) => request<void>(`/v1/applications/${applicationId}/api-keys/${apiKeyId}`, { method: 'DELETE' }),
};
