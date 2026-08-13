import { request } from '../../services/http-client';

export interface IntegrationMonitor {
  application: {
    id: string;
    name: string;
    status: string;
    quotaPerMinute: number;
    quotaPerDay: number;
    usedLastMinute: number;
    usedLastDay: number;
    quotaStatus: string;
  };
  apiKeys: Array<{
    id: string;
    prefix: string;
    status: string;
    expiresAt: string | null;
    expiresInDays: number | null;
    lastUsedAt: string | null;
    health: string;
  }>;
  phoneNumbers: Array<{
    id: string;
    displayNumber: string;
    status: string;
    accountStatus: string;
    credentialSource: string;
    credentialExpiresAt: string | null;
    credentialHealth: string;
    health: string;
  }>;
  delivery: { sentLast24Hours: number; failedLast24Hours: number; failureRate: number };
}

export const monitoringApi = {
  getApplication: (applicationId: string) =>
    request<IntegrationMonitor>(`/v1/monitoring/applications/${applicationId}`),
};
