import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailStatus } from '../enums/email-status.enum';
import { InvalidEmailMessageError } from '../errors/invalid-email-message.error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_BODY_LENGTH = 100_000;
export interface EmailMessageProps {
  tenantId: UniqueId;
  applicationId: UniqueId;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  status: EmailStatus;
  idempotencyKey: string | null;
  requestId: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface CreateEmailMessageParams {
  tenantId: UniqueId;
  applicationId: UniqueId;
  to: string;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  idempotencyKey?: string;
  requestId?: string;
}

export class EmailMessage extends Entity<EmailMessageProps> {
  private constructor(props: EmailMessageProps, id?: UniqueId) {
    super(props, id);
  }
  static create(
    params: CreateEmailMessageParams,
    id?: UniqueId,
  ): Result<EmailMessage, InvalidEmailMessageError> {
    const to = params.to?.trim().toLowerCase();
    const subject = params.subject?.trim();
    const textBody = params.textBody?.trim() || null;
    const htmlBody = params.htmlBody?.trim() || null;
    if (!to || to.length > 320 || !EMAIL_PATTERN.test(to))
      return Result.fail(new InvalidEmailMessageError('to deve ser um e-mail válido.'));
    if (!subject || subject.length > 255)
      return Result.fail(
        new InvalidEmailMessageError('subject é obrigatório e deve ter até 255 caracteres.'),
      );
    if (!textBody && !htmlBody)
      return Result.fail(new InvalidEmailMessageError('textBody ou htmlBody deve ser informado.'));
    if ((textBody?.length ?? 0) > MAX_BODY_LENGTH || (htmlBody?.length ?? 0) > MAX_BODY_LENGTH)
      return Result.fail(
        new InvalidEmailMessageError('O corpo do e-mail excede 100000 caracteres.'),
      );
    const now = new Date();
    return Result.ok(
      new EmailMessage(
        {
          tenantId: params.tenantId,
          applicationId: params.applicationId,
          to,
          subject,
          textBody,
          htmlBody,
          status: EmailStatus.PENDING,
          idempotencyKey: params.idempotencyKey ?? null,
          requestId: params.requestId ?? null,
          providerMessageId: null,
          attemptCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        id,
      ),
    );
  }
  static reconstitute(props: EmailMessageProps, id: UniqueId): EmailMessage {
    return new EmailMessage(props, id);
  }
  get tenantId(): UniqueId {
    return this.props.tenantId;
  }
  get applicationId(): UniqueId {
    return this.props.applicationId;
  }
  get to(): string {
    return this.props.to;
  }
  get subject(): string {
    return this.props.subject;
  }
  get textBody(): string | null {
    return this.props.textBody;
  }
  get htmlBody(): string | null {
    return this.props.htmlBody;
  }
  get status(): EmailStatus {
    return this.props.status;
  }
  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
  }
  get requestId(): string | null {
    return this.props.requestId;
  }
  get providerMessageId(): string | null {
    return this.props.providerMessageId;
  }
  get attemptCount(): number {
    return this.props.attemptCount;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  markProcessing(): void {
    this.assertTransition([EmailStatus.PENDING, EmailStatus.RETRY], EmailStatus.PROCESSING);
    this.props.attemptCount += 1;
    this.transitionTo(EmailStatus.PROCESSING);
  }
  markSent(providerMessageId: string): void {
    this.assertTransition([EmailStatus.PROCESSING], EmailStatus.SENT);
    this.props.providerMessageId = providerMessageId;
    this.transitionTo(EmailStatus.SENT);
  }
  markFailed(): void {
    this.assertTransition([EmailStatus.PROCESSING], EmailStatus.FAILED);
    this.transitionTo(EmailStatus.FAILED);
  }
  scheduleRetry(): void {
    this.assertTransition([EmailStatus.FAILED], EmailStatus.RETRY);
    this.transitionTo(EmailStatus.RETRY);
  }
  private transitionTo(status: EmailStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }
  private assertTransition(allowed: EmailStatus[], target: EmailStatus): void {
    if (!allowed.includes(this.props.status))
      throw new Error(
        `Invalid EmailMessage state transition from ${this.props.status} to ${target}.`,
      );
  }
}
