import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Message } from '../entities/message.entity';
import { MessageStatus } from '../enums/message-status.enum';
import { NewOutboxEvent } from '@shared/outbox';

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
  | { outcome: 'saved'; outboxPersisted?: boolean }
  | { outcome: 'rate_limited'; scope: 'minute' | 'day' }
  | { outcome: 'idempotent_conflict'; existing: Message };

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  saveWithOutbox?(message: Message, events: NewOutboxEvent | NewOutboxEvent[]): Promise<void>;
  /**
   * Insere a mensagem só se a aplicação ainda estiver dentro da quota, checando e inserindo
   * atomicamente (trava por applicationId) para fechar a corrida entre requisições concorrentes
   * que passariam ambas na checagem antes de qualquer insert acontecer.
   */
  saveWithQuotaCheck(
    message: Message,
    limits: MessageQuotaLimits,
    outboxEvent?: NewOutboxEvent,
  ): Promise<SaveWithQuotaCheckResult>;
  claimForProcessing?(id: UniqueId): Promise<Message | null>;
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
