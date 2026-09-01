import { PaginatedResult, SortDirection } from '@shared/types';
import { NewOutboxEvent } from '@shared/outbox';

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

/** Campos pelos quais a listagem de eventos de webhook pode ser ordenada. */
export enum WebhookEventSortField {
  STATUS = 'status',
  RECEIVED_AT = 'receivedAt',
}

export interface ListWebhookEventsFilter {
  status?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: WebhookEventSortField;
  sortDirection?: SortDirection;
}

export interface IWebhookEventOperationsRepository {
  list(
    page: number,
    pageSize: number,
    filter?: ListWebhookEventsFilter,
  ): Promise<PaginatedResult<WebhookEventOperationDto>>;
  requeue(id: string): Promise<WebhookEventOperationDto | null>;
  requeueWithOutbox?(id: string, event: NewOutboxEvent): Promise<WebhookEventOperationDto | null>;
}

export const WEBHOOK_EVENT_OPERATIONS_REPOSITORY = Symbol('WEBHOOK_EVENT_OPERATIONS_REPOSITORY');
