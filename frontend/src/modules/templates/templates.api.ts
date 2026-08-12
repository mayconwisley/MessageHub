import { request } from '../../services/http-client';
export interface Template { id: string; name: string; language: string; category: string; status: string; components: unknown[]; createdAt: string; [key: string]: unknown }
export const templatesApi = {
  list: (whatsAppAccountId: string) => request<Template[]>(`/v1/templates?whatsAppAccountId=${encodeURIComponent(whatsAppAccountId)}`, { authorization: 'api-key' }),
  create: (data: { whatsAppAccountId: string; name: string; language: string; category: string; body: string }) => request<Template>('/v1/templates', { method: 'POST', authorization: 'api-key', body: { ...data, components: [{ type: 'BODY', text: data.body }] } }),
  sync: (whatsAppAccountId: string) => request<Record<string, number>>('/v1/templates/sync', { method: 'POST', authorization: 'api-key', body: { whatsAppAccountId } }),
};
