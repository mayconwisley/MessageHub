export interface ApplicationDto {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
  createdAt: Date;
}
