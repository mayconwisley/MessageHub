import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, MoreThanOrEqual, QueryFailedError, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Message, MessageProps } from '../../domain/entities/message.entity';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import {
  IMessageRepository,
  ListMessagesFilter,
  MessageQuotaLimits,
  SaveWithQuotaCheckResult,
} from '../../domain/repositories/message.repository.interface';
import { MessageContent } from '../../domain/value-objects/message-content.value-object';
import { MessageType } from '../../domain/enums/message-type.enum';
import { TemplateMessage } from '../../domain/value-objects/template-message.value-object';
import { MessageOrmEntity } from '../entities/message.orm-entity';
import { NewOutboxEvent } from '@shared/outbox';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';

/** Namespace arbitrário para travas consultivas desta feature, evita colisão com outras travas futuras. */
const MESSAGE_QUOTA_LOCK_NAMESPACE = 424_242;
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class PostgresMessageRepository implements IMessageRepository {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly repository: Repository<MessageOrmEntity>,
  ) {}

  async save(message: Message): Promise<void> {
    await this.repository.save(this.toOrmEntity(message));
  }

  async saveWithOutbox(message: Message, events: NewOutboxEvent | NewOutboxEvent[]): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.save(this.toOrmEntity(message));
      await manager
        .getRepository(OutboxEventOrmEntity)
        .save((Array.isArray(events) ? events : [events]).map(OutboxRepository.createEntity));
    });
  }

  async saveWithQuotaCheck(
    message: Message,
    limits: MessageQuotaLimits,
    outboxEvent?: NewOutboxEvent,
  ): Promise<SaveWithQuotaCheckResult> {
    const queryRunner = this.repository.manager.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Trava exclusiva por applicationId, liberada automaticamente ao fim da transação
      // (xact-scoped) - serializa a checagem de quota com o insert para fechar a corrida
      // entre requisições concorrentes que, sem isso, passariam todas na contagem antes de
      // qualquer insert acontecer.
      await queryRunner.query('SELECT pg_advisory_xact_lock($1, hashtext($2))', [
        MESSAGE_QUOTA_LOCK_NAMESPACE,
        message.applicationId.value,
      ]);

      const now = Date.now();
      const [lastMinute, lastDay] = await Promise.all([
        queryRunner.manager.count(MessageOrmEntity, {
          where: {
            applicationId: message.applicationId.value,
            createdAt: MoreThanOrEqual(new Date(now - 60_000)),
          },
        }),
        queryRunner.manager.count(MessageOrmEntity, {
          where: {
            applicationId: message.applicationId.value,
            createdAt: MoreThanOrEqual(new Date(now - 86_400_000)),
          },
        }),
      ]);

      if (lastMinute >= limits.perMinute) {
        await queryRunner.rollbackTransaction();
        return { outcome: 'rate_limited', scope: 'minute' };
      }
      if (lastDay >= limits.perDay) {
        await queryRunner.rollbackTransaction();
        return { outcome: 'rate_limited', scope: 'day' };
      }

      await queryRunner.manager.save(this.toOrmEntity(message));
      if (outboxEvent) {
        await queryRunner.manager
          .getRepository(OutboxEventOrmEntity)
          .save(OutboxRepository.createEntity(outboxEvent));
      }
      await queryRunner.commitTransaction();
      return { outcome: 'saved', outboxPersisted: Boolean(outboxEvent) };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      const driverCode =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (driverCode === UNIQUE_VIOLATION && message.idempotencyKey) {
        // Duas requisições concorrentes com a mesma chave de idempotência: a perdedora
        // do índice único (applicationId, idempotencyKey) recupera a mensagem já criada
        // pela vencedora, em vez de propagar o erro de violação de constraint.
        const existing = await this.findByIdempotencyKey(
          message.applicationId,
          message.idempotencyKey,
        );
        if (existing) {
          return { outcome: 'idempotent_conflict', existing };
        }
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: UniqueId): Promise<Message | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async claimForProcessing(id: UniqueId): Promise<Message | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(MessageOrmEntity)
      .set({
        status: MessageStatus.PROCESSING,
        attemptCount: () => '"attempt_count" + 1',
        updatedAt: new Date(),
      })
      .where('id = :id', { id: id.value })
      .andWhere('status IN (:...statuses)', {
        statuses: [MessageStatus.PENDING, MessageStatus.RETRY],
      })
      .returning('*')
      .execute();
    if (!result.affected) return null;
    return this.findById(id);
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

  countCreatedSince(applicationId: UniqueId, since: Date): Promise<number> {
    return this.repository.count({
      where: { applicationId: applicationId.value, createdAt: MoreThanOrEqual(since) },
    });
  }

  async listByApplicationId(
    applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListMessagesFilter,
  ): Promise<PaginatedResult<Message>> {
    const query = this.repository
      .createQueryBuilder('message')
      .where('message.application_id = :applicationId', { applicationId: applicationId.value });
    if (filter?.status) query.andWhere('message.status = :status', { status: filter.status });
    if (filter?.search) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        new Brackets((where) =>
          where
            .where('message.id::text ILIKE :search', { search })
            .orWhere('message.provider_message_id ILIKE :search', { search })
            .orWhere('message.request_id ILIKE :search', { search })
            .orWhere('message.idempotency_key ILIKE :search', { search })
            .orWhere('message.to ILIKE :search', { search }),
        ),
      );
    }
    const [rows, total] = await query
      .orderBy('message.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  private toOrmEntity(message: Message): MessageOrmEntity {
    const orm = new MessageOrmEntity();
    orm.id = message.id.value;
    orm.tenantId = message.tenantId.value;
    orm.applicationId = message.applicationId.value;
    orm.phoneNumberId = message.phoneNumberId.value;
    orm.to = message.to;
    orm.content = message.content.body;
    orm.type = message.type;
    orm.template = message.template
      ? {
          metaTemplateId: message.template.metaTemplateId,
          name: message.template.name,
          language: message.template.language,
          parameters: message.template.parameters,
        }
      : null;
    orm.status = message.status;
    orm.idempotencyKey = message.idempotencyKey;
    orm.requestId = message.requestId;
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

    const templateResult = row.template
      ? TemplateMessage.create({
          metaTemplateId: row.template.metaTemplateId as string | null,
          name: row.template.name as string,
          language: row.template.language as string,
          parameters: row.template.parameters as [],
        })
      : null;
    if (templateResult?.isFailure)
      throw new Error(`Corrupted template payload persisted for message ${row.id}.`);
    const props: MessageProps = {
      tenantId: UniqueId.create(row.tenantId),
      applicationId: UniqueId.create(row.applicationId),
      phoneNumberId: UniqueId.create(row.phoneNumberId),
      to: row.to,
      content: contentResult.value,
      type: (row.type ?? MessageType.TEXT) as MessageType,
      template: templateResult?.value ?? null,
      status: row.status as MessageStatus,
      idempotencyKey: row.idempotencyKey,
      requestId: row.requestId,
      providerMessageId: row.providerMessageId,
      attemptCount: row.attemptCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Message.reconstitute(props, UniqueId.create(row.id));
  }
}
