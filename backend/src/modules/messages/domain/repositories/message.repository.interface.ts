import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Message } from '../entities/message.entity';
import { MessageStatus } from '../enums/message-status.enum';

export interface ListMessagesFilter {
  status?: MessageStatus;
}

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findById(id: UniqueId): Promise<Message | null>;
  findByIdempotencyKey(applicationId: UniqueId, idempotencyKey: string): Promise<Message | null>;
  findByProviderMessageId(providerMessageId: string): Promise<Message | null>;
  listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListMessagesFilter,
  ): Promise<PaginatedResult<Message>>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
