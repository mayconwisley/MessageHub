import { Query } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { EmailMessageDto } from '../dto/email-message.dto';

export class ListEmailsQuery extends Query<Result<PaginatedResult<EmailMessageDto>, BaseError>> {
  constructor(
    public readonly applicationId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: EmailStatus,
    public readonly search?: string,
    public readonly requestingTenantId?: string,
  ) {
    super();
  }
}
