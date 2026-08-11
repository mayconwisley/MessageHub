import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { Message, MessageProps } from '../../domain/entities/message.entity';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { IMessageRepository } from '../../domain/repositories/message.repository.interface';
import { MessageContent } from '../../domain/value-objects/message-content.value-object';
import { MessageOrmEntity } from '../entities/message.orm-entity';

@Injectable()
export class PostgresMessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly repository: Repository<MessageOrmEntity>,
  ) {}

  async save(message: Message): Promise<void> {
    await this.repository.save(this.toOrmEntity(message));
  }

  async findById(id: UniqueId): Promise<Message | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdempotencyKey(
    applicationId: UniqueId,
    idempotencyKey: string,
  ): Promise<Message | null> {
    const row = await this.repository.findOne({
      where: { applicationId: applicationId.value, idempotencyKey },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByProviderMessageId(providerMessageId: string): Promise<Message | null> {
    const row = await this.repository.findOne({ where: { providerMessageId } });
    return row ? this.toDomain(row) : null;
  }

  private toOrmEntity(message: Message): MessageOrmEntity {
    const orm = new MessageOrmEntity();
    orm.id = message.id.value;
    orm.tenantId = message.tenantId.value;
    orm.applicationId = message.applicationId.value;
    orm.phoneNumberId = message.phoneNumberId.value;
    orm.to = message.to;
    orm.content = message.content.body;
    orm.status = message.status;
    orm.idempotencyKey = message.idempotencyKey;
    orm.providerMessageId = message.providerMessageId;
    orm.attemptCount = message.attemptCount;
    orm.createdAt = message.createdAt;
    orm.updatedAt = message.updatedAt;
    return orm;
  }

  private toDomain(row: MessageOrmEntity): Message {
    const contentResult = MessageContent.create(row.content);
    if (contentResult.isFailure) {
      throw new Error(`Corrupted message content persisted for message ${row.id}.`);
    }

    const props: MessageProps = {
      tenantId: UniqueId.create(row.tenantId),
      applicationId: UniqueId.create(row.applicationId),
      phoneNumberId: UniqueId.create(row.phoneNumberId),
      to: row.to,
      content: contentResult.value,
      status: row.status as MessageStatus,
      idempotencyKey: row.idempotencyKey,
      providerMessageId: row.providerMessageId,
      attemptCount: row.attemptCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Message.reconstitute(props, UniqueId.create(row.id));
  }
}
