export interface EmailMessageDto {
  id: string;
  tenantId: string;
  applicationId: string;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  status: string;
  idempotencyKey: string | null;
  requestId: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
