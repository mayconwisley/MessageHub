import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
import { PaginatedResult, SortDirection } from '@shared/types';
import {
  WebhookEventOperationDto,
  WebhookEventSortField,
} from '../ports/webhook-event-operations.repository.interface';

export class ListWebhookEventsQuery extends Query<
  Result<PaginatedResult<WebhookEventOperationDto>, BaseError>
> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: WebhookEventSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
