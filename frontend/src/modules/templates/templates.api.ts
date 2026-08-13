import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: {
    headerText?: string[];
    bodyText?: Array<string[] | { values: string[] }>;
  };
  buttons?: TemplateButton[];
  location?: Record<string, unknown>;
}

export interface TemplateButton {
  type: string;
  text?: string;
  url?: string;
  example?: string;
}

export interface TemplateMutationData {
  tenantId: string;
  whatsAppAccountId: string;
  name: string;
  language: string;
  category: string;
  components: TemplateComponent[];
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
  list: (params: {
    tenantId: string;
    whatsAppAccountId: string;
    page: number;
    pageSize: number;
    status?: string;
    category?: string;
    sync?: boolean;
  }) =>
    request<PaginatedResult<Template>>(
      `/v1/templates${toQueryString({ ...params, sync: params.sync ? 'true' : undefined })}`,
    ),
  getById: (id: string, tenantId: string) =>
    request<Template>(`/v1/templates/${id}${toQueryString({ tenantId })}`),
  create: (data: TemplateMutationData) =>
    request<Template>('/v1/templates', {
      method: 'POST',
      body: data,
    }),
  update: (id: string, data: Pick<TemplateMutationData, 'tenantId' | 'category' | 'components'>) =>
    request<Template>(`/v1/templates/${id}`, {
      method: 'PUT',
      body: data,
    }),
  delete: (id: string, tenantId: string) =>
    request<void>(`/v1/templates/${id}${toQueryString({ tenantId })}`, {
      method: 'DELETE',
    }),
  sync: (tenantId: string, whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/sync', {
      method: 'POST',
      body: { tenantId, whatsAppAccountId },
    }),
  publishPending: (tenantId: string, whatsAppAccountId: string) =>
    request<Record<string, number>>('/v1/templates/publish-pending', {
      method: 'POST',
      body: { tenantId, whatsAppAccountId },
    }),
};
