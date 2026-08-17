import { request } from '../../services/http-client';

export interface EmailMessage {
  id: string;
  tenantId: string;
  applicationId: string;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  status: string;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export const emailsApi = {
  send: (data: { applicationId: string; to: string; subject: string; textBody: string }) =>
    request<EmailMessage>('/v1/emails', {
      method: 'POST',
      body: data,
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
};
