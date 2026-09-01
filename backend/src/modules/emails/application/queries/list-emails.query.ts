import { Query } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { EmailSortField } from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageDto } from '../dto/email-message.dto';

export class ListEmailsQuery extends Query<Result<PaginatedResult<EmailMessageDto>, BaseError>> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: EmailStatus,
    public readonly search?: string,
    public readonly requestingTenantId?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: EmailSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
