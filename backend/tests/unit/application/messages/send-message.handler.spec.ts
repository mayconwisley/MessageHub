import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { Application } from '@modules/applications/domain/entities/application.entity';
import { IApplicationRepository } from '@modules/applications/domain/repositories/application.repository.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { SendMessageCommand } from '@modules/messages/application/commands/send-message.command';
import { SendMessageHandler } from '@modules/messages/application/handlers/send-message.handler';
import {
  IMessagePublisher,
  MessageRequestedPayload,
} from '@modules/messages/application/ports/message-publisher.interface';
import { Message } from '@modules/messages/domain/entities/message.entity';
import { IMessageRepository } from '@modules/messages/domain/repositories/message.repository.interface';

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

class FakeMessageRepository implements IMessageRepository {
  readonly saved: Message[] = [];
  async save(message: Message): Promise<void> {
    this.saved.push(message);
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
  async listByApplicationId(): Promise<import('@shared/types').PaginatedResult<Message>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeMessagePublisher implements IMessagePublisher {
  readonly published: MessageRequestedPayload[] = [];
  async publishMessageRequested(payload: MessageRequestedPayload): Promise<void> {
    this.published.push(payload);
  }
}

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
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
      new FakePhoneNumberRepository([phoneNumber]),
      new FakeWhatsAppAccountRepository([whatsAppAccount]),
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

    const dto = expectOk(result);
    expect(dto.status).toBe('PENDING');
    expect(messageRepository.saved).toHaveLength(1);
    expect(messagePublisher.published).toEqual([{ messageId: dto.id }]);
  });

  it('returns the existing message when the idempotency key repeats', async () => {
    const { handler, application, phoneNumber, messageRepository } = buildHandler();

    const first = expectOk(
      await handler.execute(
        new SendMessageCommand(
          application.id.value,
          phoneNumber.id.value,
          '+5511988888888',
          'Ola!',
          'idem-key-1',
        ),
      ),
    );

    const second = expectOk(
      await handler.execute(
        new SendMessageCommand(
          application.id.value,
          phoneNumber.id.value,
          '+5511988888888',
          'Ola de novo!',
          'idem-key-1',
        ),
      ),
    );

    expect(second.id).toBe(first.id);
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
      new FakePhoneNumberRepository([foreignPhoneNumber]),
      new FakeWhatsAppAccountRepository([foreignAccount]),
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
});
