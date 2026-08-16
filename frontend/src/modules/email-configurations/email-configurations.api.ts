import { request, toQueryString } from '../../services/http-client';

export interface EmailSmtpConfiguration {
  id: string | null;
  source: 'default' | 'tenant' | 'none';
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ConfigureEmailSmtpRequest {
  tenantId: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export const emailConfigurationsApi = {
  getSmtp: (tenantId: string) =>
    request<EmailSmtpConfiguration>(`/v1/email-configurations/smtp${toQueryString({ tenantId })}`),
  configureSmtp: (data: ConfigureEmailSmtpRequest) =>
    request<EmailSmtpConfiguration>('/v1/email-configurations/smtp', {
      method: 'PUT',
      body: data,
    }),
  removeSmtp: (tenantId: string) =>
    request<void>(`/v1/email-configurations/smtp${toQueryString({ tenantId })}`, {
      method: 'DELETE',
    }),
};
