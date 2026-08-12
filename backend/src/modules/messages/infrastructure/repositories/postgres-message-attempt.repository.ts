import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageAttempt } from '../../domain/entities/message-attempt.entity';
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
}
