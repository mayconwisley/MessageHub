import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import { MessageTimelineEventDto } from '../ports/message-timeline.repository.interface';

export class ListMessageTimelineQuery extends Query<
  Result<MessageTimelineEventDto[], MessageNotFoundError>
> {
  constructor(
    public readonly messageId: string,
    public readonly applicationId: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
