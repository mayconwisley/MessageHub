import { Entity, UniqueId } from '@shared/domain';
import { EmailAttemptStatus } from '../enums/email-attempt-status.enum';
export interface EmailAttemptProps {
  emailMessageId: UniqueId;
  attemptNumber: number;
  status: EmailAttemptStatus;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: Date;
}
export class EmailAttempt extends Entity<EmailAttemptProps> {
  private constructor(props: EmailAttemptProps, id?: UniqueId) {
    super(props, id);
  }
  static create(params: Omit<EmailAttemptProps, 'occurredAt'>, id?: UniqueId): EmailAttempt {
    return new EmailAttempt({ ...params, occurredAt: new Date() }, id);
  }
  get emailMessageId(): UniqueId {
    return this.props.emailMessageId;
  }
  get attemptNumber(): number {
    return this.props.attemptNumber;
  }
  get status(): EmailAttemptStatus {
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
