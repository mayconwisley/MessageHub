import { UniqueId } from '@shared/domain';
import { WhatsAppAccount } from '../entities/whatsapp-account.entity';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccountStatus } from '../enums/whatsapp-account-status.enum';

export interface ListWhatsAppAccountsFilter {
  status?: WhatsAppAccountStatus;
}

export interface IWhatsAppAccountRepository {
  save(whatsAppAccount: WhatsAppAccount): Promise<void>;
  findById(id: UniqueId): Promise<WhatsAppAccount | null>;
  listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListWhatsAppAccountsFilter,
  ): Promise<PaginatedResult<WhatsAppAccount>>;
  findIdsByTenantId(tenantId: UniqueId): Promise<UniqueId[]>;
}

export const WHATSAPP_ACCOUNT_REPOSITORY = Symbol('WHATSAPP_ACCOUNT_REPOSITORY');
