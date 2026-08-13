import { request } from '../../services/http-client';
export interface SandboxConfiguration {
  enabled: boolean;
  activeProvider: 'meta' | 'sandbox';
}
export const sandboxApi = {
  configuration: () => request<SandboxConfiguration>('/v1/sandbox/messages/configuration'),
  simulateStatus: (messageId: string, status: 'DELIVERED' | 'READ' | 'FAILED') =>
    request<void>(`/v1/sandbox/messages/${messageId}/status`, { method: 'POST', body: { status } }),
};
