import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { ApiKey } from '../entities/api-key.entity';

export interface IApiKeyRepository {
  save(apiKey: ApiKey): Promise<void>;
  findById(id: UniqueId): Promise<ApiKey | null>;
  listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<ApiKey>>;
}

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');
