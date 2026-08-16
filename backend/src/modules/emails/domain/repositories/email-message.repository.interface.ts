import { UniqueId } from '@shared/domain';
import { EmailMessage } from '../entities/email-message.entity';

export interface IEmailMessageRepository {
  save(message: EmailMessage): Promise<void>;
  findById(id: UniqueId): Promise<EmailMessage | null>;
  findByIdempotencyKey(
    applicationId: UniqueId,
    idempotencyKey: string,
  ): Promise<EmailMessage | null>;
}
export const EMAIL_MESSAGE_REPOSITORY = Symbol('EMAIL_MESSAGE_REPOSITORY');
