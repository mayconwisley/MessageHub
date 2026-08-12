import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import { MessageDto } from '../dto/message.dto';

export class GetMessageQuery extends Query<Result<MessageDto, MessageNotFoundError>> {
  constructor(
    public readonly messageId: string,
    public readonly applicationId: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
