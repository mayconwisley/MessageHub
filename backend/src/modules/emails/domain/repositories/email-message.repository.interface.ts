import { UniqueId } from '@shared/domain';
import { EmailMessage } from '../entities/email-message.entity';
import { NewOutboxEvent } from '@shared/outbox';

export interface IEmailMessageRepository {
  save(message: EmailMessage): Promise<void>;
  saveWithOutbox?(message: EmailMessage, events: NewOutboxEvent | NewOutboxEvent[]): Promise<void>;
  claimForProcessing?(id: UniqueId): Promise<EmailMessage | null>;
  findById(id: UniqueId): Promise<EmailMessage | null>;
  findByIdempotencyKey(
    applicationId: UniqueId,
    idempotencyKey: string,
  ): Promise<EmailMessage | null>;
}
export const EMAIL_MESSAGE_REPOSITORY = Symbol('EMAIL_MESSAGE_REPOSITORY');
