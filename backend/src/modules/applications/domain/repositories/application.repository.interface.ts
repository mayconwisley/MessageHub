import { UniqueId } from '@shared/domain';
import { Application } from '../entities/application.entity';

export interface IApplicationRepository {
  save(application: Application): Promise<void>;
  findById(id: UniqueId): Promise<Application | null>;
}

export const APPLICATION_REPOSITORY = Symbol('APPLICATION_REPOSITORY');
