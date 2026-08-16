import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { Repository } from 'typeorm';
import { EmailMessage, EmailMessageProps } from '../../domain/entities/email-message.entity';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { IEmailMessageRepository } from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageOrmEntity } from '../entities/email-message.orm-entity';

@Injectable()
export class PostgresEmailMessageRepository implements IEmailMessageRepository {
  constructor(
    @InjectRepository(EmailMessageOrmEntity)
    private readonly repository: Repository<EmailMessageOrmEntity>,
  ) {}
  async save(message: EmailMessage): Promise<void> {
    await this.repository.save(this.toOrm(message));
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
