import { UniqueId } from '@shared/domain';
import { WhatsAppAccount } from '../entities/whatsapp-account.entity';
import { PaginatedResult, SortDirection } from '@shared/types';
import { WhatsAppAccountStatus } from '../enums/whatsapp-account-status.enum';

/** Campos pelos quais a listagem de contas WhatsApp pode ser ordenada. */
export enum WhatsAppAccountSortField {
  WABA_ID = 'wabaId',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export interface ListWhatsAppAccountsFilter {
  status?: WhatsAppAccountStatus;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: WhatsAppAccountSortField;
  sortDirection?: SortDirection;
}

export interface IWhatsAppAccountRepository {
  save(whatsAppAccount: WhatsAppAccount): Promise<void>;
  findById(id: UniqueId): Promise<WhatsAppAccount | null>;
  findByTenantAndWabaId(tenantId: UniqueId, wabaId: string): Promise<WhatsAppAccount | null>;
  listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListWhatsAppAccountsFilter,
  ): Promise<PaginatedResult<WhatsAppAccount>>;
  findIdsByTenantId(tenantId: UniqueId): Promise<UniqueId[]>;
}

export const WHATSAPP_ACCOUNT_REPOSITORY = Symbol('WHATSAPP_ACCOUNT_REPOSITORY');
