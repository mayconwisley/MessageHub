import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { BaseError } from '@shared/errors';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { ListMessagesQuery } from '../queries/list-messages.query';

@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler implements IQueryHandler<ListMessagesQuery> {
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messages: IMessageRepository) {}

  async execute(
    query: ListMessagesQuery,
  ): Promise<Result<PaginatedResult<MessageDto>, BaseError>> {
    const result = await this.messages.listByApplicationId(
      UniqueId.create(query.applicationId),
      query.page,
      query.pageSize,
      query.status ? { status: query.status } : undefined,
    );
    return Result.ok({ ...result, items: result.items.map((message) => MessageMapper.toDto(message)) });
  }
}
