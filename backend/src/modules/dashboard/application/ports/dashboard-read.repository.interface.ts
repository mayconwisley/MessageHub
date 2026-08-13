export interface DashboardResourceSummaryDto {
  tenants: number;
  applications: number;
  whatsAppAccounts: number;
  phoneNumbers: number;
}

export interface DashboardMessageVolumePointDto {
  date: string;
  messages: number;
}

export interface DashboardStatusDistributionDto {
  status: string;
  total: number;
}

export interface DashboardDeliveryStatusDto {
  total: number;
  items: DashboardStatusDistributionDto[];
}

export interface DashboardOperationalHealthDto {
  pendingMessages: number;
  failedLast24Hours: number;
  activePhoneNumbers: number;
  successRate: number;
}

export interface DashboardRecentMessageDto {
  id: string;
  recipientLastFour: string;
  status: string;
  type: string;
  createdAt: Date;
}

export interface IDashboardReadRepository {
  getResourceSummary(tenantId?: string): Promise<DashboardResourceSummaryDto>;
  getMessageVolume(tenantId?: string): Promise<DashboardMessageVolumePointDto[]>;
  getDeliveryStatus(tenantId?: string): Promise<DashboardDeliveryStatusDto>;
  getOperationalHealth(tenantId?: string): Promise<DashboardOperationalHealthDto>;
  getRecentMessages(tenantId?: string): Promise<DashboardRecentMessageDto[]>;
}

export const DASHBOARD_READ_REPOSITORY = Symbol('DASHBOARD_READ_REPOSITORY');
