import { request } from '../../services/http-client';

export interface Entity { id: string; status: string; createdAt: string; [key: string]: unknown }
export const administrationApi = {
  createTenant: (name: string) => request<Entity>('/v1/tenants', { method: 'POST', body: { name } }),
  getTenant: (id: string) => request<Entity>(`/v1/tenants/${id}`),
  createApplication: (data: { tenantId: string; name: string }) => request<Entity>('/v1/applications', { method: 'POST', body: data }),
  createAccount: (data: Record<string, string>) => request<Entity>('/v1/whatsapp-accounts', { method: 'POST', body: data }),
  getAccount: (id: string) => request<Entity>(`/v1/whatsapp-accounts/${id}`),
  createPhoneNumber: (data: { whatsAppAccountId: string; phoneNumberId: string; displayNumber: string }) => request<Entity>('/v1/phone-numbers', { method: 'POST', body: data }),
  getPhoneNumber: (id: string) => request<Entity>(`/v1/phone-numbers/${id}`),
  createApiKey: (applicationId: string, data: { type: string; expiresAt?: string }) => request<Entity & { plainTextKey: string }>(`/v1/applications/${applicationId}/api-keys`, { method: 'POST', body: data }),
  revokeApiKey: (applicationId: string, apiKeyId: string) => request<void>(`/v1/applications/${applicationId}/api-keys/${apiKeyId}`, { method: 'DELETE' }),
};
