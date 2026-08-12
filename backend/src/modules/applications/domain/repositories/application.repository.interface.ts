import { UniqueId } from '@shared/domain';
import { Application } from '../entities/application.entity';
import { PaginatedResult } from '@shared/types';

export interface IApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: UniqueId): Promise<Application | null>;
  listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
  ): Promise<PaginatedResult<Application>>;
}

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');
