import { UniqueId } from '@shared/domain';
import { EmailMessage } from '../entities/email-message.entity';
import { EmailAttempt } from '../entities/email-attempt.entity';
import { NewOutboxEvent } from '@shared/outbox';

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
}
export const EMAIL_MESSAGE_REPOSITORY = Symbol('EMAIL_MESSAGE_REPOSITORY');
