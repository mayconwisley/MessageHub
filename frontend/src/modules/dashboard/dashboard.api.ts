import { request } from '../../services/http-client';

export interface ResourceSummary {
  tenants: number;
  applications: number;
  whatsAppAccounts: number;
  phoneNumbers: number;
}

export interface MessageVolumePoint {
  date: string;
  messages: number;
}

export interface DeliveryStatus {
  total: number;
  items: Array<{ status: string; total: number }>;
}

export interface OperationalHealth {
  pendingMessages: number;
  failedLast24Hours: number;
  activePhoneNumbers: number;
  successRate: number;
}

export interface RecentMessage {
  id: string;
  recipientLastFour: string;
  status: string;
  type: string;
  createdAt: string;
}

export interface HealthCheck {
  status: 'ok' | 'error';
  error?: Record<string, unknown>;
  details: {
    database?: { status: 'up' | 'down'; message?: string };
    rabbitmq?: { status: 'up' | 'down'; message?: string };
  };
}

export const dashboardApi = {
  getResourceSummary: () => request<ResourceSummary>('/v1/dashboard/resource-summary'),
  getMessageVolume: () => request<MessageVolumePoint[]>('/v1/dashboard/message-volume'),
  getDeliveryStatus: () => request<DeliveryStatus>('/v1/dashboard/delivery-status'),
  getOperationalHealth: () => request<OperationalHealth>('/v1/dashboard/operational-health'),
  getRecentMessages: () => request<RecentMessage[]>('/v1/dashboard/recent-messages'),
  health: () => request<HealthCheck>('/health'),
};
