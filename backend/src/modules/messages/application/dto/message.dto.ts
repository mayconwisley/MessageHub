export interface MessageDto {
  id: string;
  tenantId: string;
  applicationId: string;
  phoneNumberId: string;
  to: string;
  content: string;
  type: string;
  template: {
    metaTemplateId: string | null;
    name: string;
    language: string;
    parameters: unknown[];
  } | null;
  status: string;
  idempotencyKey: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
