import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult, SortDirection } from '@shared/types';
import { BaseError } from '@shared/errors';
import { WhatsAppAccountStatus } from '../../domain/enums/whatsapp-account-status.enum';
import { WhatsAppAccountSortField } from '../../domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
export class ListWhatsAppAccountsQuery extends Query<
  Result<PaginatedResult<WhatsAppAccountDto>, BaseError>
> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly status?: WhatsAppAccountStatus,
    public readonly search?: string,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
    public readonly sortBy?: WhatsAppAccountSortField,
    public readonly sortDirection?: SortDirection,
  ) {
    super();
  }
}
