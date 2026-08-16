export interface EmailSmtpConfigurationDto {
  id: string | null;
  source: 'default' | 'tenant' | 'none';
  host: string | null;
  port: number | null;
  secure: boolean | null;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
