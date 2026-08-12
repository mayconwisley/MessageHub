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
  list: (params: { whatsAppAccountId: string; page: number; pageSize: number; status?: string; category?: string; sync?: boolean }) =>
    request<PaginatedResult<Template>>(
      `/v1/templates${toQueryString({ ...params, sync: params.sync ? 'true' : undefined })}`,
      { authorization: 'api-key' },
    ),
  getById: (id: string) => request<Template>(`/v1/templates/${id}`, { authorization: 'api-key' }),
  create: (data: { whatsAppAccountId: string; name: string; language: string; category: string; body: string }) =>
    request<Template>('/v1/templates', {
      method: 'POST',
      authorization: 'api-key',
      body: { ...data, components: [{ type: 'BODY', text: data.body }] },
    }),
  update: (id: string, data: { category: string; body: string }) =>
    request<Template>(`/v1/templates/${id}`, {
      method: 'PUT',
      authorization: 'api-key',
      body: { category: data.category, components: [{ type: 'BODY', text: data.body }] },
    }),
  delete: (id: string) => request<void>(`/v1/templates/${id}`, { method: 'DELETE', authorization: 'api-key' }),
  sync: (whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/sync', { method: 'POST', authorization: 'api-key', body: { whatsAppAccountId } }),
  publishPending: (whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/publish-pending', { method: 'POST', authorization: 'api-key', body: { whatsAppAccountId } }),
};
