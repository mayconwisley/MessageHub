import { request, toQueryString } from '../../services/http-client';
import type { PaginatedResult } from '../../services/pagination';

export interface ApiKey {
  id: string;
  applicationId: string;
  prefix: string;
  status: string;
  type: 'platform' | 'tenant';
  createdAt: string;
  expiresAt: string | null;
}

export interface CreatedApiKey extends ApiKey {
  plainTextKey: string;
}

export const apiKeysApi = {
  list: (applicationId: string, params: { page: number; pageSize: number }) =>
    request<PaginatedResult<ApiKey>>(`/v1/applications/${applicationId}/api-keys${toQueryString(params)}`),
  create: (applicationId: string, data: { type: string; expiresAt?: string }) =>
    request<CreatedApiKey>(`/v1/applications/${applicationId}/api-keys`, { method: 'POST', body: data }),
  revoke: (applicationId: string, apiKeyId: string) =>
    request<void>(`/v1/applications/${applicationId}/api-keys/${apiKeyId}`, { method: 'DELETE' }),
};
