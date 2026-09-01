import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { ApplicationDto } from '../dto/application.dto';
import { ApplicationMapper } from '../mappers/application.mapper';
import { GetApplicationQuery } from '../queries/get-application.query';

@QueryHandler(GetApplicationQuery)
export class GetApplicationHandler implements IQueryHandler<GetApplicationQuery> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}

  async execute(
    query: GetApplicationQuery,
  ): Promise<Result<ApplicationDto, ApplicationNotFoundError>> {
    const application = await this.applications.findById(UniqueId.create(query.applicationId));
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(query.applicationId));
    }
    return Result.ok(ApplicationMapper.toDto(application));
  }
}
