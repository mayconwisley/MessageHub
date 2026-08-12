import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import { MessageAttemptDto } from '../dto/message.dto';

export class ListMessageAttemptsQuery extends Query<
  Result<MessageAttemptDto[], MessageNotFoundError>
> {
  constructor(
    public readonly messageId: string,
    public readonly applicationId: string,
  ) {
    super();
  }
}
