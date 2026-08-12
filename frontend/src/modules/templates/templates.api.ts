import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  [key: string]: unknown;
}

export interface Template {
  id: string;
  localId: string;
  whatsAppAccountId: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: TemplateComponent[];
  rejectedReason?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  list: (params: { tenantId: string; whatsAppAccountId: string; page: number; pageSize: number; status?: string; category?: string; sync?: boolean }) =>
    request<PaginatedResult<Template>>(
      `/v1/templates${toQueryString({ ...params, sync: params.sync ? 'true' : undefined })}`,
    ),
  getById: (id: string, tenantId: string) =>
    request<Template>(`/v1/templates/${id}${toQueryString({ tenantId })}`),
  create: (data: { tenantId: string; whatsAppAccountId: string; name: string; language: string; category: string; body: string }) =>
    request<Template>('/v1/templates', {
      method: 'POST',
      body: { ...data, components: [{ type: 'BODY', text: data.body }] },
    }),
  update: (id: string, data: { tenantId: string; category: string; body: string }) =>
    request<Template>(`/v1/templates/${id}`, {
      method: 'PUT',
      body: { tenantId: data.tenantId, category: data.category, components: [{ type: 'BODY', text: data.body }] },
    }),
  delete: (id: string, tenantId: string) =>
    request<void>(`/v1/templates/${id}${toQueryString({ tenantId })}`, { method: 'DELETE' }),
  sync: (tenantId: string, whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/sync', { method: 'POST', body: { tenantId, whatsAppAccountId } }),
  publishPending: (tenantId: string, whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/publish-pending', { method: 'POST', body: { tenantId, whatsAppAccountId } }),
};
