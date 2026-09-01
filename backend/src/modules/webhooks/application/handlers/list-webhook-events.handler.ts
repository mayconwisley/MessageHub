import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';
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

  async execute(
    query: ListWebhookEventsQuery,
  ): Promise<Result<PaginatedResult<WebhookEventOperationDto>, BaseError>> {
    const result = await this.events.list(query.page, query.pageSize, {
      status: query.status,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });
    return Result.ok(result);
  }
}
