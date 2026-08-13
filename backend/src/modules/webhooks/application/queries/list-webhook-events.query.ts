import { Query } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { WebhookEventOperationDto } from '../ports/webhook-event-operations.repository.interface';

export class ListWebhookEventsQuery extends Query<PaginatedResult<WebhookEventOperationDto>> {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: string,
  ) {
    super();
  }
}
