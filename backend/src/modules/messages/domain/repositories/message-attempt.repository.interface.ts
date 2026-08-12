import { MessageAttempt } from '../entities/message-attempt.entity';

export interface IMessageAttemptRepository {
  save(attempt: MessageAttempt): Promise<void>;
}

export const MESSAGE_ATTEMPT_REPOSITORY = Symbol('MESSAGE_ATTEMPT_REPOSITORY');
