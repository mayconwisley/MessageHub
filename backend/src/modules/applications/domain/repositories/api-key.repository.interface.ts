import { UniqueId } from '@shared/domain';
import { ApiKey } from '../entities/api-key.entity';

export interface IApiKeyRepository {
  save(apiKey: ApiKey): Promise<void>;
  findById(id: UniqueId): Promise<ApiKey | null>;
}

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY');
