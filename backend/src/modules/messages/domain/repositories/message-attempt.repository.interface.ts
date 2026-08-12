import { UniqueId } from '@shared/domain';
import { MessageAttempt } from '../entities/message-attempt.entity';

export interface IMessageAttemptRepository {
  save(attempt: MessageAttempt): Promise<void>;
  listByMessageId(messageId: UniqueId): Promise<MessageAttempt[]>;
  findLatestByMessageId(messageId: UniqueId): Promise<MessageAttempt | null>;
}

export const MESSAGE_ATTEMPT_REPOSITORY = Symbol('MESSAGE_ATTEMPT_REPOSITORY');
