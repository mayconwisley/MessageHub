import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { Brackets, Repository } from 'typeorm';
import { EmailMessage, EmailMessageProps } from '../../domain/entities/email-message.entity';
import {
  EmailSortField,
  IEmailMessageRepository,
  ListEmailsFilter,
} from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageOrmEntity } from '../entities/email-message.orm-entity';
import { EmailAttemptOrmEntity } from '../entities/email-attempt.orm-entity';
import { EmailAttempt } from '../../domain/entities/email-attempt.entity';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { NewOutboxEvent } from '@shared/outbox';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';
import { PaginatedResult, SortDirection } from '@shared/types';

/** Mapeia o campo de ordenação exposto pela API para a coluna correspondente na querybuilder. */
const SORT_COLUMN_BY_FIELD: Record<EmailSortField, string> = {
  [EmailSortField.STATUS]: 'email.status',
  [EmailSortField.CREATED_AT]: 'email.created_at',
};

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
        .save(
          (Array.isArray(events) ? events : [events]).map((event) =>
            OutboxRepository.createEntity(event),
          ),
        );
    });
  }
  async saveDeliveryOutcome(
    message: EmailMessage,
    attempt: EmailAttempt,
    events?: NewOutboxEvent | NewOutboxEvent[],
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.save(this.toOrm(message));
      await manager.save(this.toAttemptOrm(attempt));
      if (events) {
        await manager
          .getRepository(OutboxEventOrmEntity)
          .save(
            (Array.isArray(events) ? events : [events]).map((event) =>
              OutboxRepository.createEntity(event),
            ),
          );
      }
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
  async listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListEmailsFilter,
  ): Promise<PaginatedResult<EmailMessage>> {
    const query = this.repository
      .createQueryBuilder('email')
      .where('email.application_id = :applicationId', { applicationId: applicationId.value });

    if (filter?.status) query.andWhere('email.status = :status', { status: filter.status });
    if (filter?.createdFrom) {
      query.andWhere('email.created_at >= :createdFrom', { createdFrom: filter.createdFrom });
    }
    if (filter?.createdTo) {
      query.andWhere('email.created_at <= :createdTo', { createdTo: filter.createdTo });
    }
    if (filter?.search?.trim()) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        new Brackets((where) =>
          where
            .where('email.id::text ILIKE :search', { search })
            .orWhere('email.provider_message_id ILIKE :search', { search })
            .orWhere('email.request_id ILIKE :search', { search })
            .orWhere('email.idempotency_key ILIKE :search', { search })
            .orWhere('email.to ILIKE :search', { search })
            .orWhere('email.subject ILIKE :search', { search }),
        ),
      );
    }

    const sortColumn = SORT_COLUMN_BY_FIELD[filter?.sortBy ?? EmailSortField.CREATED_AT];
    const sortDirection = filter?.sortDirection ?? SortDirection.DESC;
    const [rows, total] = await query
      .orderBy(sortColumn, sortDirection)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
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

  private toAttemptOrm(attempt: EmailAttempt): EmailAttemptOrmEntity {
    const row = new EmailAttemptOrmEntity();
    row.id = attempt.id.value;
    row.emailMessageId = attempt.emailMessageId.value;
    row.attemptNumber = attempt.attemptNumber;
    row.status = attempt.status;
    row.errorCode = attempt.errorCode;
    row.errorMessage = attempt.errorMessage;
    row.occurredAt = attempt.occurredAt;
    return row;
  }
}
