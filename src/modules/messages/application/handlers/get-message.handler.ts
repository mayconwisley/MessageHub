import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { GetMessageQuery } from '../queries/get-message.query';

@QueryHandler(GetMessageQuery)
export class GetMessageHandler implements IQueryHandler<GetMessageQuery> {
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository) {}

  async execute(query: GetMessageQuery): Promise<Result<MessageDto, MessageNotFoundError>> {
    const message = await this.messageRepository.findById(UniqueId.create(query.messageId));
    if (!message || message.applicationId.value !== query.applicationId) {
      // Nunca revelar que a Message existe em outra Application/Tenant (secao 17).
      return Result.fail(new MessageNotFoundError(query.messageId));
    }

    return Result.ok(MessageMapper.toDto(message));
  }
}
