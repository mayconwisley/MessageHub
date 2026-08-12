import { UniqueId } from '@shared/domain';
import { Message } from '@modules/messages/domain/entities/message.entity';
import { IMessageRepository } from '@modules/messages/domain/repositories/message.repository.interface';
import {
  IMessageStatusWebhookPublisher,
  MessageStatusChangedPayload,
} from '@modules/messages/application/ports/message-status-webhook-publisher.interface';
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

const fakeLogger = { setContext: () => undefined, error: () => undefined } as unknown as PinoLogger;

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
    const repository = new FakeMessageRepository(created.value);
    const publisher = new FakeMessageStatusWebhookPublisher();
    const processor = new MetaWebhookProcessor(repository, publisher, fakeLogger);

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
    expect(repository.saved).toBe(1);
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]).toMatchObject({
      messageId: created.value.id.value,
      status: MessageStatus.DELIVERED,
    });
  });
});
