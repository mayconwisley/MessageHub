import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { MessageAttempt } from '../../domain/entities/message-attempt.entity';
import { MessageAttemptStatus } from '../../domain/enums/message-attempt-status.enum';
import { IMessageAttemptRepository } from '../../domain/repositories/message-attempt.repository.interface';
import { MessageAttemptOrmEntity } from '../entities/message-attempt.orm-entity';

@Injectable()
export class PostgresMessageAttemptRepository implements IMessageAttemptRepository {
  constructor(
    @InjectRepository(MessageAttemptOrmEntity)
    private readonly repository: Repository<MessageAttemptOrmEntity>,
  ) {}

  async save(attempt: MessageAttempt): Promise<void> {
    const orm = new MessageAttemptOrmEntity();
    orm.id = attempt.id.value;
    orm.messageId = attempt.messageId.value;
    orm.attemptNumber = attempt.attemptNumber;
    orm.status = attempt.status;
    orm.errorCode = attempt.errorCode;
    orm.errorMessage = attempt.errorMessage;
    orm.occurredAt = attempt.occurredAt;
    await this.repository.save(orm);
  }

  async listByMessageId(messageId: UniqueId): Promise<MessageAttempt[]> {
    const rows = await this.repository.find({
      where: { messageId: messageId.value },
      order: { attemptNumber: 'ASC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findLatestByMessageId(messageId: UniqueId): Promise<MessageAttempt | null> {
    const row = await this.repository.findOne({
      where: { messageId: messageId.value },
      order: { attemptNumber: 'DESC' },
    });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: MessageAttemptOrmEntity): MessageAttempt {
    return MessageAttempt.reconstitute(
      {
        messageId: UniqueId.create(row.messageId),
        attemptNumber: row.attemptNumber,
        status: row.status as MessageAttemptStatus,
        errorCode: row.errorCode,
        errorMessage: row.errorMessage,
        occurredAt: row.occurredAt,
      },
      UniqueId.create(row.id),
    );
  }
}
