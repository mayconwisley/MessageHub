import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { ApplicationDto } from '../dto/application.dto';
import { ApplicationMapper } from '../mappers/application.mapper';
import { ListApplicationsQuery } from '../queries/list-applications.query';
@QueryHandler(ListApplicationsQuery)
export class ListApplicationsHandler implements IQueryHandler<ListApplicationsQuery> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}
  async execute(
    query: ListApplicationsQuery,
  ): Promise<Result<PaginatedResult<ApplicationDto>, BaseError>> {
    const result = await this.applications.listByTenantId(
      UniqueId.create(query.tenantId),
      query.page,
      query.pageSize,
      { search: query.search },
    );
    return Result.ok({
      ...result,
      items: result.items.map((application) => ApplicationMapper.toDto(application)),
    });
  }
}
