import { UniqueId } from '@shared/domain';
import { Message } from '@modules/messages/domain/entities/message.entity';
import { IMessageRepository } from '@modules/messages/domain/repositories/message.repository.interface';
import {
  IMessageStatusWebhookPublisher,
  MessageStatusChangedPayload,
} from '@modules/messages/application/ports/message-status-webhook-publisher.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { IApplicationPhoneNumberLinkRepository } from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import {
  IInboundMessageWebhookPublisher,
  InboundMessageReceivedPayload,
} from '@modules/webhooks/application/ports/inbound-message-webhook-publisher.interface';
import { MetaWebhookProcessor } from '@modules/webhooks/application/services/meta-webhook.processor';
import { MessageStatus } from '@modules/messages/domain/enums/message-status.enum';
import { PinoLogger } from 'nestjs-pino';

class FakeMessageRepository implements IMessageRepository {
  constructor(private readonly message: Message | null) {}
  saved = 0;
  async save(): Promise<void> {
    this.saved++;
  }
  async findById(): Promise<Message | null> {
    return null;
  }
  async findByIdempotencyKey(): Promise<Message | null> {
    return null;
  }
  async findByProviderMessageId(): Promise<Message | null> {
    return this.message;
  }
  async listByApplicationId(): Promise<import('@shared/types').PaginatedResult<Message>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeMessageStatusWebhookPublisher implements IMessageStatusWebhookPublisher {
  readonly published: MessageStatusChangedPayload[] = [];
  async publishMessageStatusChanged(payload: MessageStatusChangedPayload): Promise<void> {
    this.published.push(payload);
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

class FakeApplicationPhoneNumberLinkRepository implements IApplicationPhoneNumberLinkRepository {
  constructor(private readonly applicationIds: UniqueId[]) {}
  async replaceForApplication(): Promise<void> {}
  async listPhoneNumberIdsByApplication(): Promise<UniqueId[]> {
    return [];
  }
  async listApplicationIdsByPhoneNumber(): Promise<UniqueId[]> {
    return this.applicationIds;
  }
}

class FakeInboundMessageWebhookPublisher implements IInboundMessageWebhookPublisher {
  readonly published: InboundMessageReceivedPayload[] = [];
  async publishInboundMessageReceived(payload: InboundMessageReceivedPayload): Promise<void> {
    this.published.push(payload);
  }
}

const fakeLogger = { setContext: () => undefined, error: () => undefined } as unknown as PinoLogger;

function createProcessor(options: {
  message?: Message | null;
  phoneNumber?: PhoneNumber | null;
  linkedApplicationIds?: UniqueId[];
}) {
  const messages = new FakeMessageRepository(options.message ?? null);
  const statusWebhookPublisher = new FakeMessageStatusWebhookPublisher();
  const phoneNumbers = new FakePhoneNumberRepository(options.phoneNumber ?? null);
  const links = new FakeApplicationPhoneNumberLinkRepository(options.linkedApplicationIds ?? []);
  const inboundMessageWebhookPublisher = new FakeInboundMessageWebhookPublisher();
  const processor = new MetaWebhookProcessor(
    messages,
    statusWebhookPublisher,
    phoneNumbers,
    links,
    inboundMessageWebhookPublisher,
    fakeLogger,
  );
  return { processor, messages, statusWebhookPublisher, inboundMessageWebhookPublisher };
}

describe('MetaWebhookProcessor', () => {
  it('updates a sent message from a valid Meta delivery status', async () => {
    const created = Message.create({
      tenantId: UniqueId.create(),
      applicationId: UniqueId.create(),
      phoneNumberId: UniqueId.create(),
      to: '+5511999999999',
      content: 'Olá',
    });
    if (created.isFailure) throw new Error('Fixture creation failed.');
    created.value.markProcessing();
    created.value.markSent('wamid.1');
    const { processor, messages, statusWebhookPublisher } = createProcessor({
      message: created.value,
    });

    await processor.process({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            { field: 'messages', value: { statuses: [{ id: 'wamid.1', status: 'delivered' }] } },
          ],
        },
      ],
    });

    expect(created.value.status).toBe(MessageStatus.DELIVERED);
    expect(messages.saved).toBe(1);
    expect(statusWebhookPublisher.published).toHaveLength(1);
    expect(statusWebhookPublisher.published[0]).toMatchObject({
      messageId: created.value.id.value,
      status: MessageStatus.DELIVERED,
    });
  });

  it('forwards an inbound message to every Application linked to the phone number', async () => {
    const phoneNumberCreated = PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: '1234567890',
      displayNumber: '+55 11 90000-0000',
    });
    if (phoneNumberCreated.isFailure) throw new Error('Fixture creation failed.');
    const applicationIds = [UniqueId.create(), UniqueId.create()];
    const { processor, inboundMessageWebhookPublisher } = createProcessor({
      phoneNumber: phoneNumberCreated.value,
      linkedApplicationIds: applicationIds,
    });

    await processor.process({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: '1234567890' },
                messages: [{ id: 'wamid.2', from: '5511999999999', type: 'text' }],
              },
            },
          ],
        },
      ],
    });

    expect(inboundMessageWebhookPublisher.published).toHaveLength(2);
    expect(inboundMessageWebhookPublisher.published.map((p) => p.applicationId)).toEqual(
      applicationIds.map((id) => id.value),
    );
  });

  it('forwards the BSUID and profile name when a WhatsApp username hides the phone number', async () => {
    const phoneNumberCreated = PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: '1234567890',
      displayNumber: '+55 11 90000-0000',
    });
    if (phoneNumberCreated.isFailure) throw new Error('Fixture creation failed.');
    const { processor, inboundMessageWebhookPublisher } = createProcessor({
      phoneNumber: phoneNumberCreated.value,
      linkedApplicationIds: [UniqueId.create()],
    });

    await processor.process({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: '1234567890' },
                contacts: [{ wa_id: 'bsuid:customer-123', profile: { name: 'Maria Silva' } }],
                messages: [{ id: 'wamid.4', from: 'bsuid:customer-123', type: 'text' }],
              },
            },
          ],
        },
      ],
    });

    expect(inboundMessageWebhookPublisher.published[0]?.sender).toEqual({
      id: 'bsuid:customer-123',
      displayName: 'Maria Silva',
    });
  });

  it('does not publish anything when the phone number has no linked Application', async () => {
    const phoneNumberCreated = PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: '1234567890',
      displayNumber: '+55 11 90000-0000',
    });
    if (phoneNumberCreated.isFailure) throw new Error('Fixture creation failed.');
    const { processor, inboundMessageWebhookPublisher } = createProcessor({
      phoneNumber: phoneNumberCreated.value,
      linkedApplicationIds: [],
    });

    await processor.process({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              field: 'messages',
              value: {
                metadata: { phone_number_id: '1234567890' },
                messages: [{ id: 'wamid.3', from: '5511999999999', type: 'text' }],
              },
            },
          ],
        },
      ],
    });

    expect(inboundMessageWebhookPublisher.published).toHaveLength(0);
  });
});
