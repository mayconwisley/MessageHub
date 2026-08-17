import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailMessageNotFoundError } from '../../domain/errors/email-message-not-found.error';
import {
  EMAIL_MESSAGE_REPOSITORY,
  IEmailMessageRepository,
} from '../../domain/repositories/email-message.repository.interface';
import {
  EMAIL_TIMELINE_REPOSITORY,
  EmailTimelineEventDto,
  IEmailTimelineRepository,
} from '../ports/email-timeline.repository.interface';
import { ListEmailTimelineQuery } from '../queries/list-email-timeline.query';

@QueryHandler(ListEmailTimelineQuery)
export class ListEmailTimelineHandler implements IQueryHandler<ListEmailTimelineQuery> {
  constructor(
    @Inject(EMAIL_MESSAGE_REPOSITORY) private readonly emails: IEmailMessageRepository,
    @Inject(EMAIL_TIMELINE_REPOSITORY)
    private readonly timeline: IEmailTimelineRepository,
  ) {}

  async execute(
    query: ListEmailTimelineQuery,
  ): Promise<Result<EmailTimelineEventDto[], EmailMessageNotFoundError>> {
    const email = await this.emails.findById(UniqueId.create(query.emailMessageId));
    if (
      !email ||
      email.applicationId.value !== query.applicationId ||
      (query.requestingTenantId && email.tenantId.value !== query.requestingTenantId)
    ) {
      return Result.fail(new EmailMessageNotFoundError());
    }
    return Result.ok(await this.timeline.listByEmailMessageId(email.id.value));
  }
}
