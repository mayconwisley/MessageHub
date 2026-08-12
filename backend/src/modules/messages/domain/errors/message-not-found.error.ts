import { DomainError } from '@shared/errors';

export class MessageNotFoundError extends DomainError {
  constructor(messageId: string) {
    super('MESSAGE_NOT_FOUND', `Mensagem ${messageId} não encontrada.`);
  }
}
