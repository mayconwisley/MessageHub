import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface Application {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface WebhookConfig {
  webhookUrl: string | null;
  webhookSecret: string | null;
}

export interface LinkedPhoneNumber {
  id: string;
  phoneNumberId: string;
  displayNumber: string;
  [key: string]: unknown;
}

export const applicationsApi = {
  list: (params: { tenantId: string; page: number; pageSize: number }) =>
    request<PaginatedResult<Application>>(`/v1/applications${toQueryString(params)}`),
  create: (data: { tenantId: string; name: string }) =>
    request<Application>('/v1/applications', { method: 'POST', body: data }),
  configureWebhook: (applicationId: string, webhookUrl: string | null) =>
    request<WebhookConfig>(`/v1/applications/${applicationId}/webhook`, { method: 'PUT', body: { webhookUrl } }),
  listLinkedPhoneNumbers: (applicationId: string) =>
    request<LinkedPhoneNumber[]>(`/v1/applications/${applicationId}/phone-numbers`),
  setLinkedPhoneNumbers: (applicationId: string, phoneNumberIds: string[]) =>
    request<LinkedPhoneNumber[]>(`/v1/applications/${applicationId}/phone-numbers`, {
      method: 'PUT',
      body: { phoneNumberIds },
    }),
};
