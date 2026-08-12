import { request } from '../../services/http-client';
export interface Message { id: string; to: string; content: string; status: string; type: string; createdAt: string; updatedAt: string; attemptCount: number; [key: string]: unknown }
export const messagesApi = {
  send: (data: { phoneNumberId: string; to: string; content: string }) => request<Message>('/v1/messages', { method: 'POST', body: data, authorization: 'api-key', headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  get: (id: string) => request<Message>(`/v1/messages/${id}`, { authorization: 'api-key' }),
};
