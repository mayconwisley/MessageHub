import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Message } from '../entities/message.entity';
import { MessageStatus } from '../enums/message-status.enum';

export interface ListMessagesFilter {
  status?: MessageStatus;
  /** Busca por messageId, providerMessageId, requestId, chave de idempotência ou destinatário. */
  search?: string;
}

export interface MessageQuotaLimits {
  perMinute: number;
  perDay: number;
}

export type SaveWithQuotaCheckResult =
  | { outcome: 'saved' }
  | { outcome: 'rate_limited'; scope: 'minute' | 'day' }
  | { outcome: 'idempotent_conflict'; existing: Message };

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  /**
   * Insere a mensagem só se a aplicação ainda estiver dentro da quota, checando e inserindo
   * atomicamente (trava por applicationId) para fechar a corrida entre requisições concorrentes
   * que passariam ambas na checagem antes de qualquer insert acontecer.
   */
  saveWithQuotaCheck(
    message: Message,
    limits: MessageQuotaLimits,
  ): Promise<SaveWithQuotaCheckResult>;
  findById(id: UniqueId): Promise<Message | null>;
  findByIdempotencyKey(applicationId: UniqueId, idempotencyKey: string): Promise<Message | null>;
  findByProviderMessageId(providerMessageId: string): Promise<Message | null>;
  countCreatedSince(applicationId: UniqueId, since: Date): Promise<number>;
  listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListMessagesFilter,
  ): Promise<PaginatedResult<Message>>;
}

export const MESSAGE_REPOSITORY = Symbol('MESSAGE_REPOSITORY');
