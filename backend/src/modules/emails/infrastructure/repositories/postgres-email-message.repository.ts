import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { Repository } from 'typeorm';
import { EmailMessage, EmailMessageProps } from '../../domain/entities/email-message.entity';
import { IEmailMessageRepository } from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageOrmEntity } from '../entities/email-message.orm-entity';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { NewOutboxEvent } from '@shared/outbox';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';

@Injectable()
export class PostgresEmailMessageRepository implements IEmailMessageRepository {
  constructor(
    @InjectRepository(EmailMessageOrmEntity)
    private readonly repository: Repository<EmailMessageOrmEntity>,
  ) {}
  async save(message: EmailMessage): Promise<void> {
    await this.repository.save(this.toOrm(message));
  }
  async saveWithOutbox(
    message: EmailMessage,
    events: NewOutboxEvent | NewOutboxEvent[],
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.save(this.toOrm(message));
      await manager
        .getRepository(OutboxEventOrmEntity)
        .save((Array.isArray(events) ? events : [events]).map(OutboxRepository.createEntity));
    });
  }
  async claimForProcessing(id: UniqueId): Promise<EmailMessage | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(EmailMessageOrmEntity)
      .set({
        status: EmailStatus.PROCESSING,
        attemptCount: () => '"attempt_count" + 1',
        updatedAt: new Date(),
      })
      .where('id = :id', { id: id.value })
      .andWhere('status IN (:...statuses)', { statuses: [EmailStatus.PENDING, EmailStatus.RETRY] })
      .execute();
    if (!result.affected) return null;
    return this.findById(id);
  }
  async findById(id: UniqueId): Promise<EmailMessage | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }
  async findByIdempotencyKey(
    applicationId: UniqueId,
    idempotencyKey: string,
  ): Promise<EmailMessage | null> {
    const row = await this.repository.findOne({
      where: { applicationId: applicationId.value, idempotencyKey },
    });
    return row ? this.toDomain(row) : null;
  }
  private toOrm(message: EmailMessage): EmailMessageOrmEntity {
    const row = new EmailMessageOrmEntity();
    row.id = message.id.value;
    row.tenantId = message.tenantId.value;
    row.applicationId = message.applicationId.value;
    row.to = message.to;
    row.subject = message.subject;
    row.textBody = message.textBody;
    row.htmlBody = message.htmlBody;
    row.status = message.status;
    row.idempotencyKey = message.idempotencyKey;
    row.providerMessageId = message.providerMessageId;
    row.requestId = message.requestId;
    row.attemptCount = message.attemptCount;
    row.createdAt = message.createdAt;
    row.updatedAt = message.updatedAt;
    return row;
  }
  private toDomain(row: EmailMessageOrmEntity): EmailMessage {
    const props: EmailMessageProps = {
      tenantId: UniqueId.create(row.tenantId),
      applicationId: UniqueId.create(row.applicationId),
      to: row.to,
      subject: row.subject,
      textBody: row.textBody,
      htmlBody: row.htmlBody,
      status: row.status as EmailStatus,
      idempotencyKey: row.idempotencyKey,
      requestId: row.requestId,
      providerMessageId: row.providerMessageId,
      attemptCount: row.attemptCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return EmailMessage.reconstitute(props, UniqueId.create(row.id));
  }
}
