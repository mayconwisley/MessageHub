import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { MessageDto } from '../dto/message.dto';

export class ListMessagesQuery extends Query<Result<PaginatedResult<MessageDto>, BaseError>> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: MessageStatus,
  ) {
    super();
  }
}
