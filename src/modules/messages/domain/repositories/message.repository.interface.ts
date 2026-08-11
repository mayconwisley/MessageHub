import { UniqueId } from '@shared/domain';
import { Message } from '../entities/message.entity';

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findById(id: UniqueId): Promise<Message | null>;
  findByIdempotencyKey(applicationId: UniqueId, idempotencyKey: string): Promise<Message | null>;
  findByProviderMessageId(providerMessageId: string): Promise<Message | null>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
