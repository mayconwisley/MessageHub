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
  requestId: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  lastError: { code: string; message: string; occurredAt: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttemptDto {
  id: string;
  attemptNumber: number;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: Date;
}
