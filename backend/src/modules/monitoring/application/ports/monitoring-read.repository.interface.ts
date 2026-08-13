export interface IntegrationMonitorDto {
  application: {
    id: string;
    name: string;
    status: string;
    quotaPerMinute: number;
    quotaPerDay: number;
    usedLastMinute: number;
    usedLastDay: number;
    quotaStatus: 'HEALTHY' | 'WARNING' | 'EXCEEDED';
  };
  apiKeys: Array<{
    id: string;
    prefix: string;
    status: string;
    expiresAt: Date | null;
    expiresInDays: number | null;
    lastUsedAt: Date | null;
    health: 'HEALTHY' | 'EXPIRING' | 'EXPIRED' | 'REVOKED';
  }>;
  phoneNumbers: Array<{
    id: string;
    displayNumber: string;
    status: string;
    whatsAppAccountId: string;
    accountStatus: string;
    credentialSource: string;
    credentialExpiresAt: Date | null;
    credentialHealth: 'HEALTHY' | 'EXPIRING' | 'EXPIRED' | 'NOT_INFORMED';
    health: 'HEALTHY' | 'INACTIVE';
  }>;
  delivery: { sentLast24Hours: number; failedLast24Hours: number; failureRate: number };
}
export interface IMonitoringReadRepository {
  getIntegrationMonitor(applicationId: string): Promise<IntegrationMonitorDto | null>;
}
export const MONITORING_READ_REPOSITORY = Symbol('MONITORING_READ_REPOSITORY');
