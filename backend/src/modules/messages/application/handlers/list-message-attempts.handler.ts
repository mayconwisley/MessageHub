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
import { MessageAttemptDto } from '../dto/message.dto';
import { MessageAttemptMapper } from '../mappers/message.mapper';
import { ListMessageAttemptsQuery } from '../queries/list-message-attempts.query';

@QueryHandler(ListMessageAttemptsQuery)
export class ListMessageAttemptsHandler implements IQueryHandler<ListMessageAttemptsQuery> {
  constructor(
    @Inject(MESSAGE_REPOSITORY) private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGE_ATTEMPT_REPOSITORY)
    private readonly messageAttemptRepository: IMessageAttemptRepository,
  ) {}

  async execute(
    query: ListMessageAttemptsQuery,
  ): Promise<Result<MessageAttemptDto[], MessageNotFoundError>> {
    const messageId = UniqueId.create(query.messageId);
    const message = await this.messageRepository.findById(messageId);
    if (
      !message ||
      message.applicationId.value !== query.applicationId ||
      (query.requestingTenantId && message.tenantId.value !== query.requestingTenantId)
    ) {
      // Nunca revelar que a Message existe em outra Application/Tenant (secao 17).
      return Result.fail(new MessageNotFoundError(query.messageId));
    }

    const attempts = await this.messageAttemptRepository.listByMessageId(messageId);
    return Result.ok(attempts.map((attempt) => MessageAttemptMapper.toDto(attempt)));
  }
}
