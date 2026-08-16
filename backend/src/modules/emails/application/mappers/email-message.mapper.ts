import { EmailMessage } from '../../domain/entities/email-message.entity';
import { EmailMessageDto } from '../dto/email-message.dto';
export class EmailMessageMapper {
  static toDto(email: EmailMessage): EmailMessageDto {
    return {
      id: email.id.value,
      tenantId: email.tenantId.value,
      applicationId: email.applicationId.value,
      to: email.to,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
      status: email.status,
      idempotencyKey: email.idempotencyKey,
      requestId: email.requestId,
      providerMessageId: email.providerMessageId,
      attemptCount: email.attemptCount,
      createdAt: email.createdAt,
      updatedAt: email.updatedAt,
    };
  }
}
