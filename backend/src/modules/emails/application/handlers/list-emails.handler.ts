import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import { UniqueId } from '@shared/domain';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import {
  EMAIL_MESSAGE_REPOSITORY,
  IEmailMessageRepository,
} from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageDto } from '../dto/email-message.dto';
import { EmailMessageMapper } from '../mappers/email-message.mapper';
import { ListEmailsQuery } from '../queries/list-emails.query';

@QueryHandler(ListEmailsQuery)
export class ListEmailsHandler implements IQueryHandler<ListEmailsQuery> {
  constructor(
    @Inject(EMAIL_MESSAGE_REPOSITORY) private readonly emails: IEmailMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
  ) {}

  async execute(
    query: ListEmailsQuery,
  ): Promise<Result<PaginatedResult<EmailMessageDto>, BaseError>> {
    if (query.requestingTenantId) {
      const application = await this.applications.findById(UniqueId.create(query.applicationId));
      if (!application || application.tenantId.value !== query.requestingTenantId) {
        return Result.fail(new ApplicationNotFoundError(query.applicationId));
      }
    }

    const result = await this.emails.listByApplicationId(
      UniqueId.create(query.applicationId),
      query.page,
      query.pageSize,
      query.status || query.search ? { status: query.status, search: query.search } : undefined,
    );
    return Result.ok({
      ...result,
      items: result.items.map((email) => EmailMessageMapper.toDto(email)),
    });
  }
}
