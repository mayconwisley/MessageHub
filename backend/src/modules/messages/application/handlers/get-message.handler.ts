import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { MessageNotFoundError } from '../../domain/errors/message-not-found.error';
import {
  IMessageRepository,
  MESSAGE_REPOSITORY,
} from '../../domain/repositories/message.repository.interface';
import {
  IMessageAttemptRepository,
  MESSAGE_ATTEMPT_REPOSITORY,
} from '../../domain/repositories/message-attempt.repository.interface';
import { MessageDto } from '../dto/message.dto';
import { MessageMapper } from '../mappers/message.mapper';
import { GetMessageQuery } from '../queries/get-message.query';

@QueryHandler(GetMessageQuery)
export class GetMessageHandler implements IQueryHandler<GetMessageQuery> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGE_ATTEMPT_REPOSITORY)
    private readonly messageAttemptRepository: IMessageAttemptRepository,
  ) {}

  async execute(query: GetMessageQuery): Promise<Result<MessageDto, MessageNotFoundError>> {
    const messageId = UniqueId.create(query.messageId);
    const message = await this.messageRepository.findById(messageId);
    if (!message || message.applicationId.value !== query.applicationId) {
      // Nunca revelar que a Message existe em outra Application/Tenant (secao 17).
      return Result.fail(new MessageNotFoundError(query.messageId));
    }

    const lastAttempt = await this.messageAttemptRepository.findLatestByMessageId(messageId);
    return Result.ok(MessageMapper.toDto(message, lastAttempt));
  }
}
