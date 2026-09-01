import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '@modules/applications/domain/repositories/application.repository.interface';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { ListMessagesQuery } from '../queries/list-messages.query';

@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler implements IQueryHandler<ListMessagesQuery> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
  ) {}

  async execute(query: ListMessagesQuery): Promise<Result<PaginatedResult<MessageDto>, BaseError>> {
    if (query.requestingTenantId) {
      const application = await this.applicationRepository.findById(
        UniqueId.create(query.applicationId),
      );
      if (!application || application.tenantId.value !== query.requestingTenantId) {
        // Nunca revelar que a Application existe em outro tenant (secao 17).
        return Result.fail(new ApplicationNotFoundError(query.applicationId));
      }
    }

    const result = await this.messages.listByApplicationId(
      UniqueId.create(query.applicationId),
      query.page,
      query.pageSize,
      {
        status: query.status,
        search: query.search,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
        sortBy: query.sortBy,
        sortDirection: query.sortDirection,
      },
    );
    return Result.ok({
      ...result,
      items: result.items.map((message) => MessageMapper.toDto(message)),
    });
  }
}
