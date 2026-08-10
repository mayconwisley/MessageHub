export interface MessageDto {
  id: string;
  tenantId: string;
  applicationId: string;
  phoneNumberId: string;
  to: string;
  content: string;
  status: string;
  idempotencyKey: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
