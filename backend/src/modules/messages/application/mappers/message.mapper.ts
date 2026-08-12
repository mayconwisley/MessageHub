import { Message } from '../../domain/entities/message.entity';
import { MessageAttempt } from '../../domain/entities/message-attempt.entity';
import { MessageAttemptStatus } from '../../domain/enums/message-attempt-status.enum';
import { MessageAttemptDto, MessageDto } from '../dto/message.dto';

export class MessageMapper {
  static toDto(message: Message, lastAttempt?: MessageAttempt | null): MessageDto {
    return {
      id: message.id.value,
      tenantId: message.tenantId.value,
      applicationId: message.applicationId.value,
      phoneNumberId: message.phoneNumberId.value,
      to: message.to,
      content: message.content.body,
      type: message.type,
      template: message.template
        ? {
            metaTemplateId: message.template.metaTemplateId,
            name: message.template.name,
            language: message.template.language,
            parameters: message.template.parameters,
          }
        : null,
      status: message.status,
      idempotencyKey: message.idempotencyKey,
      providerMessageId: message.providerMessageId,
      attemptCount: message.attemptCount,
      lastError:
        lastAttempt && lastAttempt.status === MessageAttemptStatus.FAILED
          ? {
              code: lastAttempt.errorCode ?? 'UNKNOWN_ERROR',
              message: lastAttempt.errorMessage ?? 'No error details recorded.',
              occurredAt: lastAttempt.occurredAt,
            }
          : null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export class MessageAttemptMapper {
  static toDto(attempt: MessageAttempt): MessageAttemptDto {
    return {
      id: attempt.id.value,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      errorCode: attempt.errorCode,
      errorMessage: attempt.errorMessage,
      occurredAt: attempt.occurredAt,
    };
  }
}
