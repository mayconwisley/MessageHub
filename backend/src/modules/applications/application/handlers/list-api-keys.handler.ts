import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository,
} from '../../domain/repositories/api-key.repository.interface';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyMapper } from '../mappers/api-key.mapper';
import { ListApiKeysQuery } from '../queries/list-api-keys.query';

@QueryHandler(ListApiKeysQuery)
export class ListApiKeysHandler implements IQueryHandler<ListApiKeysQuery> {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: IApiKeyRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}

  async execute(
    query: ListApiKeysQuery,
  ): Promise<Result<PaginatedResult<ApiKeyDto>, ApplicationNotFoundError>> {
    const applicationId = UniqueId.create(query.applicationId);
    const application = await this.applications.findById(applicationId);
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(query.applicationId));
    }

    const result = await this.apiKeys.listByApplicationId(
      applicationId,
      query.page,
      query.pageSize,
    );
    return Result.ok({ ...result, items: result.items.map(ApiKeyMapper.toDto) });
  }
}
