import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { Message } from '@modules/messages/domain/entities/message.entity';
import { MessageAttempt } from '@modules/messages/domain/entities/message-attempt.entity';
import { MessageStatus } from '@modules/messages/domain/enums/message-status.enum';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { IMessageAttemptRepository } from '@modules/messages/domain/repositories/message-attempt.repository.interface';
import { IMessageRepository } from '@modules/messages/domain/repositories/message.repository.interface';
import {
  IMessageProvider,
  MessageDeliveryError,
  OutgoingMessage,
  ProviderMessageResult,
} from '@modules/messages/application/ports/message-provider.interface';
import {
  IMessagePublisher,
  MessageRequestedPayload,
} from '@modules/messages/application/ports/message-publisher.interface';
import {
  IMessageStatusWebhookPublisher,
  MessageStatusChangedPayload,
} from '@modules/messages/application/ports/message-status-webhook-publisher.interface';
import { MessageDeliveryProcessor } from '@modules/messages/application/services/message-delivery-processor.service';
import { MessageRetryPolicy } from '@modules/messages/application/services/message-retry-policy';

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

class FakeMessageRepository implements IMessageRepository {
  constructor(private readonly message: Message) {}
  async save(): Promise<void> {}
  async findById(): Promise<Message | null> {
    return this.message;
  }
  async findByIdempotencyKey(): Promise<Message | null> {
    return null;
  }
  async findByProviderMessageId(): Promise<Message | null> {
    return null;
  }
  async countCreatedSince(): Promise<number> {
    return 0;
  }
  async listByApplicationId(): Promise<import('@shared/types').PaginatedResult<Message>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeMessageAttemptRepository implements IMessageAttemptRepository {
  readonly saved: MessageAttempt[] = [];
  async save(attempt: MessageAttempt): Promise<void> {
    this.saved.push(attempt);
  }
  async listByMessageId(): Promise<MessageAttempt[]> {
    return this.saved;
  }
  async findLatestByMessageId(): Promise<MessageAttempt | null> {
    return this.saved.at(-1) ?? null;
  }
}

class FakePhoneNumberRepository implements IPhoneNumberRepository {
  constructor(private readonly phoneNumber: PhoneNumber | null) {}
  async save(): Promise<void> {}
  async findById(): Promise<PhoneNumber | null> {
    return this.phoneNumber;
  }
  async findByProviderPhoneNumberId(): Promise<PhoneNumber | null> {
    return this.phoneNumber;
  }
  async listByWhatsAppAccountIds(): Promise<import('@shared/types').PaginatedResult<PhoneNumber>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(private readonly account: WhatsAppAccount | null) {}
  async save(): Promise<void> {}
  async findById(): Promise<WhatsAppAccount | null> {
    return this.account;
  }
  async findByTenantAndWabaId(): Promise<WhatsAppAccount | null> {
    return null;
  }
  async listByTenantId(): Promise<import('@shared/types').PaginatedResult<WhatsAppAccount>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
  async findIdsByTenantId(): Promise<UniqueId[]> {
    return [];
  }
}

class FakeMessageProvider implements IMessageProvider {
  constructor(private readonly result: Result<ProviderMessageResult, MessageDeliveryError>) {}
  async send(_message: OutgoingMessage): Promise<Result<ProviderMessageResult, MessageDeliveryError>> {
    return this.result;
  }
}

class FakeMessagePublisher implements IMessagePublisher {
  readonly published: MessageRequestedPayload[] = [];
  readonly deadLettered: MessageRequestedPayload[] = [];
  async publishMessageRequested(payload: MessageRequestedPayload): Promise<void> {
    this.published.push(payload);
  }
  async publishToDeadLetterQueue(payload: MessageRequestedPayload): Promise<void> {
    this.deadLettered.push(payload);
  }
}

class FakeStatusWebhookPublisher implements IMessageStatusWebhookPublisher {
  readonly notified: MessageStatusChangedPayload[] = [];
  async publishMessageStatusChanged(payload: MessageStatusChangedPayload): Promise<void> {
    this.notified.push(payload);
  }
}

const fakeLogger = {
  setContext: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as PinoLogger;

function buildProcessor(
  message: Message,
  phoneNumber: PhoneNumber | null,
  account: WhatsAppAccount | null,
  providerResult: Result<ProviderMessageResult, MessageDeliveryError>,
) {
  const messageAttemptRepository = new FakeMessageAttemptRepository();
  const messagePublisher = new FakeMessagePublisher();
  const statusWebhookPublisher = new FakeStatusWebhookPublisher();
  const processor = new MessageDeliveryProcessor(
    new FakeMessageRepository(message),
    messageAttemptRepository,
    new FakePhoneNumberRepository(phoneNumber),
    new FakeWhatsAppAccountRepository(account),
    new FakeMessageProvider(providerResult),
    messagePublisher,
    statusWebhookPublisher,
    new MessageRetryPolicy(),
    fakeLogger,
  );
  return { processor, messageAttemptRepository, messagePublisher, statusWebhookPublisher };
}

describe('MessageDeliveryProcessor', () => {
  const tenantId = UniqueId.create();

  function buildMessageWithChannel() {
    const whatsAppAccount = expectOk(
      WhatsAppAccount.create({ tenantId, wabaId: 'waba-1', accessToken: 'token-1' }),
    );
    const phoneNumber = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: whatsAppAccount.id,
        phoneNumberId: 'meta-phone-1',
        displayNumber: '+5511999999999',
      }),
    );
    const message = expectOk(
      Message.create({
        tenantId,
        applicationId: UniqueId.create(),
        phoneNumberId: phoneNumber.id,
        to: '+5511988888888',
        content: 'Ola!',
      }),
    );
    return { message, phoneNumber, whatsAppAccount };
  }

  it('marks the message as SENT and notifies the status webhook on success', async () => {
    const { message, phoneNumber, whatsAppAccount } = buildMessageWithChannel();
    const { processor, messageAttemptRepository, statusWebhookPublisher } = buildProcessor(
      message,
      phoneNumber,
      whatsAppAccount,
      Result.ok({ providerMessageId: 'wamid-1' }),
    );

    await processor.process(message.id.value);

    expect(message.status).toBe(MessageStatus.SENT);
    expect(messageAttemptRepository.saved).toHaveLength(1);
    expect(statusWebhookPublisher.notified).toHaveLength(1);
    expect(statusWebhookPublisher.notified[0].status).toBe(MessageStatus.SENT);
  });

  it('sends the message straight to the DLQ when the channel is not found (non-retryable)', async () => {
    const { message } = buildMessageWithChannel();
    const { processor, messagePublisher, statusWebhookPublisher } = buildProcessor(
      message,
      null,
      null,
      Result.ok({ providerMessageId: 'unused' }),
    );

    await processor.process(message.id.value);

    expect(message.status).toBe(MessageStatus.FAILED);
    expect(messagePublisher.deadLettered).toEqual([{ messageId: message.id.value }]);
    expect(messagePublisher.published).toHaveLength(0);
    expect(statusWebhookPublisher.notified[0].status).toBe(MessageStatus.FAILED);
  });

  it('schedules a retry through the publisher when the provider fails with a retryable error', async () => {
    jest.useFakeTimers();
    try {
      const { message, phoneNumber, whatsAppAccount } = buildMessageWithChannel();
      const { processor, messagePublisher } = buildProcessor(
        message,
        phoneNumber,
        whatsAppAccount,
        Result.fail(new ProviderUnavailableError('timeout')),
      );

      await processor.process(message.id.value);

      expect(message.status).toBe(MessageStatus.RETRY);
      expect(messagePublisher.published).toHaveLength(0);

      await jest.runAllTimersAsync();

      expect(messagePublisher.published).toEqual([{ messageId: message.id.value }]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('does nothing when the message is not found', async () => {
    const { phoneNumber, whatsAppAccount } = buildMessageWithChannel();
    const messageAttemptRepository = new FakeMessageAttemptRepository();
    const messagePublisher = new FakeMessagePublisher();
    const statusWebhookPublisher = new FakeStatusWebhookPublisher();
    const missingMessageRepository: IMessageRepository = {
      save: async () => undefined,
      findById: async () => null,
      findByIdempotencyKey: async () => null,
      findByProviderMessageId: async () => null,
      countCreatedSince: async () => 0,
      listByApplicationId: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    };
    const processor = new MessageDeliveryProcessor(
      missingMessageRepository,
      messageAttemptRepository,
      new FakePhoneNumberRepository(phoneNumber),
      new FakeWhatsAppAccountRepository(whatsAppAccount),
      new FakeMessageProvider(Result.ok({ providerMessageId: 'wamid-1' })),
      messagePublisher,
      statusWebhookPublisher,
      new MessageRetryPolicy(),
      fakeLogger,
    );

    await processor.process('unknown-message-id');

    expect(messagePublisher.published).toHaveLength(0);
    expect(statusWebhookPublisher.notified).toHaveLength(0);
  });
});
