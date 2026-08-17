import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { EmailMessageNotFoundError } from '../../domain/errors/email-message-not-found.error';
import { EmailTimelineEventDto } from '../ports/email-timeline.repository.interface';

export class ListEmailTimelineQuery extends Query<
  Result<EmailTimelineEventDto[], EmailMessageNotFoundError>
> {
  constructor(
    public readonly emailMessageId: string,
    public readonly applicationId: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
