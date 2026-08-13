import { PaginatedResult } from '@shared/types';

export interface WebhookEventOperationDto {
  id: string;
  provider: string;
  payload: Record<string, unknown>;
  status: string;
  receivedAt: Date;
  processedAt: Date | null;
  failureReason: string | null;
  attemptCount: number;
  lastAttemptAt: Date | null;
}

export interface IWebhookEventOperationsRepository {
  list(
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginatedResult<WebhookEventOperationDto>>;
  requeue(id: string): Promise<WebhookEventOperationDto | null>;
}

export const WEBHOOK_EVENT_OPERATIONS_REPOSITORY = Symbol('WEBHOOK_EVENT_OPERATIONS_REPOSITORY');
