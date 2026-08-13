import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IWebhookEventOperationsRepository,
  WEBHOOK_EVENT_OPERATIONS_REPOSITORY,
  WebhookEventOperationDto,
} from '../ports/webhook-event-operations.repository.interface';
import { ListWebhookEventsQuery } from '../queries/list-webhook-events.query';
import { PaginatedResult } from '@shared/types';

@QueryHandler(ListWebhookEventsQuery)
export class ListWebhookEventsHandler implements IQueryHandler<ListWebhookEventsQuery> {
  constructor(
    @Inject(WEBHOOK_EVENT_OPERATIONS_REPOSITORY)
    private readonly events: IWebhookEventOperationsRepository,
  ) {}

  execute(query: ListWebhookEventsQuery): Promise<PaginatedResult<WebhookEventOperationDto>> {
    return this.events.list(query.page, query.pageSize, query.status);
  }
}
