import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { MessageStatus } from '../enums/message-status.enum';
import { MessageType } from '../enums/message-type.enum';
import { InvalidMessageError } from '../errors/invalid-message.error';
import { MessageContent } from '../value-objects/message-content.value-object';
import { TemplateMessage, TemplateParameterGroup } from '../value-objects/template-message.value-object';

export interface MessageProps {
  tenantId: UniqueId;
  applicationId: UniqueId;
  phoneNumberId: UniqueId;
  to: string;
  content: MessageContent;
  type: MessageType;
  template: TemplateMessage | null;
  status: MessageStatus;
  idempotencyKey: string | null;
  providerMessageId: string | null;
  attemptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateMessageParams {
  tenantId: UniqueId;
  applicationId: UniqueId;
  phoneNumberId: UniqueId;
  to: string;
  metaTemplateId: string | null;
  templateName: string;
  language: string;
  parameters?: TemplateParameterGroup[];
  idempotencyKey?: string | null;
}

export interface CreateMessageParams {
  tenantId: UniqueId;
  applicationId: UniqueId;
  phoneNumberId: UniqueId;
  to: string;
  content: string;
  idempotencyKey?: string | null;
}

/** Transicoes de estado (secao 19 do AGENTS.md) controladas exclusivamente pelo dominio. */
export class Message extends Entity<MessageProps> {
  private constructor(props: MessageProps, id?: UniqueId) {
    super(props, id);
  }

  static create(params: CreateMessageParams, id?: UniqueId): Result<Message, InvalidMessageError> {
    const to = params.to?.trim();
    if (!to) {
      return Result.fail(new InvalidMessageError('to must not be empty.'));
    }

    const contentResult = MessageContent.create(params.content);
    if (contentResult.isFailure) {
      return Result.fail(contentResult.error);
    }

    const now = new Date();
    return Result.ok(
      new Message(
        {
          tenantId: params.tenantId,
          applicationId: params.applicationId,
          phoneNumberId: params.phoneNumberId,
          to,
          content: contentResult.value,
          type: MessageType.TEXT,
          template: null,
          status: MessageStatus.PENDING,
          idempotencyKey: params.idempotencyKey ?? null,
          providerMessageId: null,
          attemptCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        id,
      ),
    );
  }

  static createTemplate(
    params: CreateTemplateMessageParams,
    id?: UniqueId,
  ): Result<Message, InvalidMessageError> {
    const to = params.to?.trim();
    if (!to) return Result.fail(new InvalidMessageError('to must not be empty.'));

    const templateResult = TemplateMessage.create({
      metaTemplateId: params.metaTemplateId,
      name: params.templateName,
      language: params.language,
      parameters: params.parameters ?? [],
    });
    if (templateResult.isFailure) return Result.fail(templateResult.error);

    const contentResult = MessageContent.create(`Template: ${templateResult.value.name}`);
    if (contentResult.isFailure) return Result.fail(contentResult.error);
    const now = new Date();
    return Result.ok(new Message({
      tenantId: params.tenantId,
      applicationId: params.applicationId,
      phoneNumberId: params.phoneNumberId,
      to,
      content: contentResult.value,
      type: MessageType.TEMPLATE,
      template: templateResult.value,
      status: MessageStatus.PENDING,
      idempotencyKey: params.idempotencyKey ?? null,
      providerMessageId: null,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    }, id));
  }

  static reconstitute(props: MessageProps, id: UniqueId): Message {
    return new Message(props, id);
  }

  get tenantId(): UniqueId {
    return this.props.tenantId;
  }

  get applicationId(): UniqueId {
    return this.props.applicationId;
  }

  get phoneNumberId(): UniqueId {
    return this.props.phoneNumberId;
  }

  get to(): string {
    return this.props.to;
  }

  get content(): MessageContent {
    return this.props.content;
  }

  get type(): MessageType { return this.props.type; }
  get template(): TemplateMessage | null { return this.props.template; }

  get status(): MessageStatus {
    return this.props.status;
  }

  get idempotencyKey(): string | null {
    return this.props.idempotencyKey;
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
    this.assertTransitionAllowed(
      [MessageStatus.PENDING, MessageStatus.RETRY],
      MessageStatus.PROCESSING,
    );
    this.props.attemptCount += 1;
    this.transitionTo(MessageStatus.PROCESSING);
  }

  markSent(providerMessageId: string): void {
    this.assertTransitionAllowed([MessageStatus.PROCESSING], MessageStatus.SENT);
    this.props.providerMessageId = providerMessageId;
    this.transitionTo(MessageStatus.SENT);
  }

  markDelivered(): void {
    this.assertTransitionAllowed([MessageStatus.SENT], MessageStatus.DELIVERED);
    this.transitionTo(MessageStatus.DELIVERED);
  }

  markRead(): void {
    this.assertTransitionAllowed([MessageStatus.DELIVERED], MessageStatus.READ);
    this.transitionTo(MessageStatus.READ);
  }

  markFailed(): void {
    this.assertTransitionAllowed([MessageStatus.PROCESSING], MessageStatus.FAILED);
    this.transitionTo(MessageStatus.FAILED);
  }

  scheduleRetry(): void {
    this.assertTransitionAllowed([MessageStatus.FAILED], MessageStatus.RETRY);
    this.transitionTo(MessageStatus.RETRY);
  }

  /** Aplica callbacks assíncronos do provedor sem reabrir transições já concluídas. */
  applyProviderStatus(status: string): boolean {
    const normalized = status.trim().toUpperCase();
    if (normalized === 'DELIVERED' && this.props.status === MessageStatus.SENT) {
      this.transitionTo(MessageStatus.DELIVERED);
      return true;
    }
    if (
      normalized === 'READ' &&
      [MessageStatus.SENT, MessageStatus.DELIVERED].includes(this.props.status)
    ) {
      this.transitionTo(MessageStatus.READ);
      return true;
    }
    if (
      normalized === 'FAILED' &&
      [MessageStatus.PENDING, MessageStatus.PROCESSING, MessageStatus.SENT].includes(
        this.props.status,
      )
    ) {
      this.transitionTo(MessageStatus.FAILED);
      return true;
    }
    return false;
  }

  private transitionTo(status: MessageStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  private assertTransitionAllowed(allowedFrom: MessageStatus[], to: MessageStatus): void {
    if (!allowedFrom.includes(this.props.status)) {
      throw new Error(`Invalid Message state transition from ${this.props.status} to ${to}.`);
    }
  }
}
