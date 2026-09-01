import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { RateLimitExceededError } from '@shared/errors';
import { Application } from '@modules/applications/domain/entities/application.entity';
import { IApplicationRepository } from '@modules/applications/domain/repositories/application.repository.interface';
import { IApplicationPhoneNumberLinkRepository } from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { SendMessageCommand } from '@modules/messages/application/commands/send-message.command';
import { SendMessageHandler } from '@modules/messages/application/handlers/send-message.handler';
import { PhoneNumberResolverService } from '@modules/messages/application/services/phone-number-resolver.service';
import {
  IMessagePublisher,
  MessageRequestedPayload,
} from '@modules/messages/application/ports/message-publisher.interface';
import { Message } from '@modules/messages/domain/entities/message.entity';
import {
  IMessageRepository,
  MessageQuotaLimits,
  SaveWithQuotaCheckResult,
} from '@modules/messages/domain/repositories/message.repository.interface';

class FakeApplicationRepository implements IApplicationRepository {
  constructor(private readonly applications: Application[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<Application | null> {
    return this.applications.find((application) => application.id.equals(id)) ?? null;
  }
  async listByTenantId(): Promise<import('@shared/types').PaginatedResult<Application>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakePhoneNumberRepository implements IPhoneNumberRepository {
  constructor(private readonly phoneNumbers: PhoneNumber[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<PhoneNumber | null> {
    return this.phoneNumbers.find((phoneNumber) => phoneNumber.id.equals(id)) ?? null;
  }
  async findByProviderPhoneNumberId(phoneNumberId: string): Promise<PhoneNumber | null> {
    return (
      this.phoneNumbers.find((phoneNumber) => phoneNumber.phoneNumberId === phoneNumberId) ?? null
    );
  }
  async listByWhatsAppAccountIds(): Promise<import('@shared/types').PaginatedResult<PhoneNumber>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(private readonly accounts: WhatsAppAccount[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    return this.accounts.find((account) => account.id.equals(id)) ?? null;
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

class FakeApplicationPhoneNumberLinkRepository implements IApplicationPhoneNumberLinkRepository {
  constructor(private readonly linked: Map<string, UniqueId[]> = new Map()) {}
  async replaceForApplication(applicationId: UniqueId, phoneNumberIds: UniqueId[]): Promise<void> {
    this.linked.set(applicationId.value, phoneNumberIds);
  }
  async listPhoneNumberIdsByApplication(applicationId: UniqueId): Promise<UniqueId[]> {
    return this.linked.get(applicationId.value) ?? [];
  }
  async listApplicationIdsByPhoneNumber(): Promise<UniqueId[]> {
    return [];
  }
}

class FakeMessageRepository implements IMessageRepository {
  readonly saved: Message[] = [];
  async save(message: Message): Promise<void> {
    this.saved.push(message);
  }
  async saveWithQuotaCheck(
    message: Message,
    limits: MessageQuotaLimits,
  ): Promise<SaveWithQuotaCheckResult> {
    const existing = message.idempotencyKey
      ? (this.saved.find((saved) => saved.idempotencyKey === message.idempotencyKey) ?? null)
      : null;
    if (existing) {
      return { outcome: 'idempotent_conflict', existing };
    }
    const lastMinute = this.saved.length;
    if (lastMinute >= limits.perMinute) {
      return { outcome: 'rate_limited', scope: 'minute' };
    }
    this.saved.push(message);
    return { outcome: 'saved' };
  }
  async findById(): Promise<Message | null> {
    return null;
  }
  async findByIdempotencyKey(): Promise<Message | null> {
    return this.saved.find((message) => message.idempotencyKey) ?? null;
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

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

function buildResolver(
  phoneNumbers: PhoneNumber[],
  accounts: WhatsAppAccount[],
  links: Map<string, UniqueId[]> = new Map(),
) {
  return new PhoneNumberResolverService(
    new FakePhoneNumberRepository(phoneNumbers),
    new FakeWhatsAppAccountRepository(accounts),
    new FakeApplicationPhoneNumberLinkRepository(links),
  );
}

describe('SendMessageHandler', () => {
  const tenantId = UniqueId.create();
  const otherTenantId = UniqueId.create();

  function buildHandler() {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
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

    const messageRepository = new FakeMessageRepository();
    const messagePublisher = new FakeMessagePublisher();
    const handler = new SendMessageHandler(
      messageRepository,
      new FakeApplicationRepository([application]),
      buildResolver([phoneNumber], [whatsAppAccount]),
      messagePublisher,
    );

    return {
      handler,
      application,
      phoneNumber,
      whatsAppAccount,
      messageRepository,
      messagePublisher,
    };
  }

  it('creates a PENDING message and publishes MessageRequested', async () => {
    const { handler, application, phoneNumber, messageRepository, messagePublisher } =
      buildHandler();

    const result = await handler.execute(
      new SendMessageCommand(application.id.value, phoneNumber.id.value, '+5511988888888', 'Ola!'),
    );

    const { message, isReplay } = expectOk(result);
    expect(message.status).toBe('PENDING');
    expect(isReplay).toBe(false);
    expect(messageRepository.saved).toHaveLength(1);
    expect(messagePublisher.published).toEqual([{ messageId: message.id }]);
  });

  it('returns RATE_LIMIT_EXCEEDED (429) when the repository reports the application is over quota', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
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
    const messagePublisher = new FakeMessagePublisher();
    const baseRepository = new FakeMessageRepository();
    const rateLimitedRepository: IMessageRepository = {
      save: (message) => baseRepository.save(message),
      saveWithQuotaCheck: async () => ({ outcome: 'rate_limited', scope: 'minute' }),
      findById: () => baseRepository.findById(),
      findByIdempotencyKey: () => baseRepository.findByIdempotencyKey(),
      findByProviderMessageId: () => baseRepository.findByProviderMessageId(),
      countCreatedSince: () => baseRepository.countCreatedSince(),
      listByApplicationId: () => baseRepository.listByApplicationId(),
    };
    const handler = new SendMessageHandler(
      rateLimitedRepository,
      new FakeApplicationRepository([application]),
      buildResolver([phoneNumber], [whatsAppAccount]),
      messagePublisher,
    );

    const result = await handler.execute(
      new SendMessageCommand(application.id.value, phoneNumber.id.value, '+5511988888888', 'Ola!'),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(RateLimitExceededError);
    expect(result.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(messagePublisher.published).toHaveLength(0);
  });

  it('returns the existing message as a replay when the idempotency key repeats with the same payload', async () => {
    const { handler, application, phoneNumber, messageRepository } = buildHandler();
    const command = new SendMessageCommand(
      application.id.value,
      phoneNumber.id.value,
      '+5511988888888',
      'Ola!',
      'idem-key-1',
    );

    const first = expectOk(await handler.execute(command));
    const second = expectOk(await handler.execute(command));

    expect(first.isReplay).toBe(false);
    expect(second.isReplay).toBe(true);
    expect(second.message.id).toBe(first.message.id);
    expect(messageRepository.saved).toHaveLength(1);
  });

  it('rejects a repeated idempotency key whose payload differs from the original request', async () => {
    const { handler, application, phoneNumber, messageRepository } = buildHandler();

    await handler.execute(
      new SendMessageCommand(
        application.id.value,
        phoneNumber.id.value,
        '+5511988888888',
        'Ola!',
        'idem-key-1',
      ),
    );

    const result = await handler.execute(
      new SendMessageCommand(
        application.id.value,
        phoneNumber.id.value,
        '+5511988888888',
        'Ola de novo, com outro conteúdo!',
        'idem-key-1',
      ),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('IDEMPOTENCY_KEY_CONFLICT');
    expect(messageRepository.saved).toHaveLength(1);
  });

  it('rejects a phone number that belongs to a different tenant', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
    const foreignAccount = expectOk(
      WhatsAppAccount.create({ tenantId: otherTenantId, wabaId: 'waba-2', accessToken: 'token-2' }),
    );
    const foreignPhoneNumber = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: foreignAccount.id,
        phoneNumberId: 'meta-phone-2',
        displayNumber: '+5511977777777',
      }),
    );

    const handler = new SendMessageHandler(
      new FakeMessageRepository(),
      new FakeApplicationRepository([application]),
      buildResolver([foreignPhoneNumber], [foreignAccount]),
      new FakeMessagePublisher(),
    );

    const result = await handler.execute(
      new SendMessageCommand(
        application.id.value,
        foreignPhoneNumber.id.value,
        '+5511988888888',
        'Ola!',
      ),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('PHONE_NUMBER_NOT_FOUND');
  });

  it('resolves the phone number from the application link when phoneNumberId is omitted', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
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

    const handler = new SendMessageHandler(
      new FakeMessageRepository(),
      new FakeApplicationRepository([application]),
      buildResolver(
        [phoneNumber],
        [whatsAppAccount],
        new Map([[application.id.value, [phoneNumber.id]]]),
      ),
      new FakeMessagePublisher(),
    );

    const result = await handler.execute(
      new SendMessageCommand(application.id.value, undefined, '+5511988888888', 'Ola!'),
    );

    expect(expectOk(result).message.status).toBe('PENDING');
  });

  it('fails with PHONE_NUMBER_NOT_CONFIGURED when no phone number is linked and none is informed', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));

    const handler = new SendMessageHandler(
      new FakeMessageRepository(),
      new FakeApplicationRepository([application]),
      buildResolver([], []),
      new FakeMessagePublisher(),
    );

    const result = await handler.execute(
      new SendMessageCommand(application.id.value, undefined, '+5511988888888', 'Ola!'),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('PHONE_NUMBER_NOT_CONFIGURED');
  });

  it('fails with AMBIGUOUS_PHONE_NUMBER when multiple phone numbers are linked and none is informed', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
    const whatsAppAccount = expectOk(
      WhatsAppAccount.create({ tenantId, wabaId: 'waba-1', accessToken: 'token-1' }),
    );
    const phoneNumberA = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: whatsAppAccount.id,
        phoneNumberId: 'meta-phone-1',
        displayNumber: '+5511999999999',
      }),
    );
    const phoneNumberB = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: whatsAppAccount.id,
        phoneNumberId: 'meta-phone-2',
        displayNumber: '+5511988888888',
      }),
    );

    const handler = new SendMessageHandler(
      new FakeMessageRepository(),
      new FakeApplicationRepository([application]),
      buildResolver(
        [phoneNumberA, phoneNumberB],
        [whatsAppAccount],
        new Map([[application.id.value, [phoneNumberA.id, phoneNumberB.id]]]),
      ),
      new FakeMessagePublisher(),
    );

    const result = await handler.execute(
      new SendMessageCommand(application.id.value, undefined, '+5511988888888', 'Ola!'),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('AMBIGUOUS_PHONE_NUMBER');
  });
});
