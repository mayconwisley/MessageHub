import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { BaseError } from '@shared/errors';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { MessageSortField } from '../../domain/repositories/message.repository.interface';
import { MessageDto } from '../dto/message.dto';

export class ListMessagesQuery extends Query<Result<PaginatedResult<MessageDto>, BaseError>> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: MessageStatus,
    public readonly search?: string,
    public readonly requestingTenantId?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: MessageSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
