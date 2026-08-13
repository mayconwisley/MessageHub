import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageTimelineRepository,
  MESSAGE_TIMELINE_REPOSITORY,
  MessageTimelineEventDto,
} from '../ports/message-timeline.repository.interface';
import { ListMessageTimelineQuery } from '../queries/list-message-timeline.query';

@QueryHandler(ListMessageTimelineQuery)
export class ListMessageTimelineHandler implements IQueryHandler<ListMessageTimelineQuery> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository,
    @Inject(MESSAGE_TIMELINE_REPOSITORY)
    private readonly timeline: IMessageTimelineRepository,
  ) {}

  async execute(
    query: ListMessageTimelineQuery,
  ): Promise<Result<MessageTimelineEventDto[], MessageNotFoundError>> {
    const message = await this.messages.findById(UniqueId.create(query.messageId));
    if (
      !message ||
      message.applicationId.value !== query.applicationId ||
      (query.requestingTenantId && message.tenantId.value !== query.requestingTenantId)
    ) {
      return Result.fail(new MessageNotFoundError(query.messageId));
    }
    return Result.ok(await this.timeline.listByMessageId(message.id.value));
  }
}
