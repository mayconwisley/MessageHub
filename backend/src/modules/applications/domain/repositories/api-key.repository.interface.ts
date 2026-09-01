import { UniqueId } from '@shared/domain';
import { PaginatedResult, SortDirection } from '@shared/types';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyStatus } from '../enums/api-key-status.enum';

/** Campos pelos quais a listagem de chaves de API pode ser ordenada. */
export enum ApiKeySortField {
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  EXPIRES_AT = 'expiresAt',
  LAST_USED_AT = 'lastUsedAt',
}

export interface ListApiKeysFilter {
  status?: ApiKeyStatus;
  /** Busca pelo prefixo público da chave. */
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: ApiKeySortField;
  sortDirection?: SortDirection;
}

export interface IApiKeyRepository {
  save(apiKey: ApiKey): Promise<void>;
  findById(id: UniqueId): Promise<ApiKey | null>;
  listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListApiKeysFilter,
  ): Promise<PaginatedResult<ApiKey>>;
  recordUsage(id: UniqueId, ipAddress?: string): Promise<void>;
}

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');
