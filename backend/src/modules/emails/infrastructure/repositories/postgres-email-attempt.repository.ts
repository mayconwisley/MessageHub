import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAttempt } from '../../domain/entities/email-attempt.entity';
import { IEmailAttemptRepository } from '../../domain/repositories/email-attempt.repository.interface';
import { EmailAttemptOrmEntity } from '../entities/email-attempt.orm-entity';
@Injectable()
export class PostgresEmailAttemptRepository implements IEmailAttemptRepository {
  constructor(
    @InjectRepository(EmailAttemptOrmEntity)
    private readonly repository: Repository<EmailAttemptOrmEntity>,
  ) {}
  async save(attempt: EmailAttempt): Promise<void> {
    const row = new EmailAttemptOrmEntity();
    row.id = attempt.id.value;
    row.emailMessageId = attempt.emailMessageId.value;
    row.attemptNumber = attempt.attemptNumber;
    row.status = attempt.status;
    row.errorCode = attempt.errorCode;
    row.errorMessage = attempt.errorMessage;
    row.occurredAt = attempt.occurredAt;
    await this.repository.save(row);
  }
}
