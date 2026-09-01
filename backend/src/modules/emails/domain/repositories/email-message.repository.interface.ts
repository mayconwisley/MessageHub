import { UniqueId } from '@shared/domain';
import { PaginatedResult, SortDirection } from '@shared/types';
import { EmailMessage } from '../entities/email-message.entity';
import { EmailAttempt } from '../entities/email-attempt.entity';
import { EmailStatus } from '../enums/email-status.enum';
import { NewOutboxEvent } from '@shared/outbox';

/** Campos pelos quais a listagem de e-mails pode ser ordenada. */
export enum EmailSortField {
  STATUS = 'status',
  CREATED_AT = 'createdAt',
}

export interface ListEmailsFilter {
  status?: EmailStatus;
  /** Busca por identificadores de rastreio, assunto ou destinatário. */
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: EmailSortField;
  sortDirection?: SortDirection;
}

export interface IEmailMessageRepository {
  save(message: EmailMessage): Promise<void>;
  saveWithOutbox?(message: EmailMessage, events: NewOutboxEvent | NewOutboxEvent[]): Promise<void>;
  /** Persiste, em uma única transação, o estado final da tentativa e os eventos derivados. */
  saveDeliveryOutcome?(
    message: EmailMessage,
    attempt: EmailAttempt,
    events?: NewOutboxEvent | NewOutboxEvent[],
  ): Promise<void>;
  claimForProcessing?(id: UniqueId): Promise<EmailMessage | null>;
  findById(id: UniqueId): Promise<EmailMessage | null>;
  findByIdempotencyKey(
    applicationId: UniqueId,
    idempotencyKey: string,
  ): Promise<EmailMessage | null>;
  listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListEmailsFilter,
  ): Promise<PaginatedResult<EmailMessage>>;
}
export const EMAIL_MESSAGE_REPOSITORY = Symbol('EMAIL_MESSAGE_REPOSITORY');
