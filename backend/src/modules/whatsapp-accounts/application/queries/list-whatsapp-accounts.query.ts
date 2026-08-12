import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
export class ListWhatsAppAccountsQuery extends Query<Result<PaginatedResult<WhatsAppAccountDto>>> {
  constructor(
    public readonly tenantId: string,
    public readonly page: number,
    public readonly pageSize: number,
  ) {
    super();
  }
}
