import { ApplicationError } from '@shared/errors';

export class MessageAlreadyProcessedError extends ApplicationError {
  constructor(messageId: string) {
    super('MESSAGE_ALREADY_PROCESSED', `Mensagem ${messageId} já foi processada.`);
  }
}
