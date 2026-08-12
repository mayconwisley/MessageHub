import { Entity, UniqueId } from '@shared/domain';
import { MessageAttemptStatus } from '../enums/message-attempt-status.enum';

export interface MessageAttemptProps {
  messageId: UniqueId;
  attemptNumber: number;
  status: MessageAttemptStatus;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: Date;
}

export interface RecordMessageAttemptParams {
  messageId: UniqueId;
  attemptNumber: number;
  status: MessageAttemptStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/** Rastro de cada tentativa de envio (nunca armazena o payload bruto da Meta - secao 36). */
export class MessageAttempt extends Entity<MessageAttemptProps> {
  private constructor(props: MessageAttemptProps, id?: UniqueId) {
    super(props, id);
  }

  static create(params: RecordMessageAttemptParams, id?: UniqueId): MessageAttempt {
    return new MessageAttempt(
      {
        messageId: params.messageId,
        attemptNumber: params.attemptNumber,
        status: params.status,
        errorCode: params.errorCode ?? null,
        errorMessage: params.errorMessage ?? null,
        occurredAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(props: MessageAttemptProps, id: UniqueId): MessageAttempt {
    return new MessageAttempt(props, id);
  }

  get messageId(): UniqueId {
    return this.props.messageId;
  }

  get attemptNumber(): number {
    return this.props.attemptNumber;
  }

  get status(): MessageAttemptStatus {
    return this.props.status;
  }

  get errorCode(): string | null {
    return this.props.errorCode;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
