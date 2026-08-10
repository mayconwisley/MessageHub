import { Message } from '../../domain/entities/message.entity';
import { MessageDto } from '../dto/message.dto';

export class MessageMapper {
  static toDto(message: Message): MessageDto {
    return {
      id: message.id.value,
      tenantId: message.tenantId.value,
      applicationId: message.applicationId.value,
      phoneNumberId: message.phoneNumberId.value,
      to: message.to,
      content: message.content.body,
      status: message.status,
      idempotencyKey: message.idempotencyKey,
      providerMessageId: message.providerMessageId,
      attemptCount: message.attemptCount,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}
