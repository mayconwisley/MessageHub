import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { QueryFailedError, Repository } from 'typeorm';
import { WebhookEventOrmEntity } from '../entities/webhook-event.orm-entity';
import { NewOutboxEvent } from '@shared/outbox';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';
import { OutboxRepository } from '@infrastructure/outbox/outbox.repository';
import {
  IWebhookEventOperationsRepository,
  WebhookEventOperationDto,
} from '../../application/ports/webhook-event-operations.repository.interface';

export interface IWebhookEventRepository {
  register(
    provider: string,
    contentHash: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookEventOrmEntity | null>;
  registerWithOutbox(
    provider: string,
    contentHash: string,
    payload: Record<string, unknown>,
    outboxEvent: NewOutboxEvent,
  ): Promise<WebhookEventOrmEntity | null>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  findById(id: string): Promise<WebhookEventOrmEntity | null>;
  markAttempted(id: string): Promise<void>;
}
export const WEBHOOK_EVENT_REPOSITORY = Symbol('WEBHOOK_EVENT_REPOSITORY');

@Injectable()
export class PostgresWebhookEventRepository
  implements IWebhookEventRepository, IWebhookEventOperationsRepository
{
  constructor(
    @InjectRepository(WebhookEventOrmEntity)
    private readonly repository: Repository<WebhookEventOrmEntity>,
  ) {}
  async register(
    provider: string,
    contentHash: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookEventOrmEntity | null> {
    const existing = await this.repository.findOne({ where: { contentHash } });
    if (existing) return existing.status === 'PENDING' ? existing : null;
    const event = Object.assign(new WebhookEventOrmEntity(), {
      id: UniqueId.create().value,
      provider,
      contentHash,
      payload,
      status: 'PENDING',
      receivedAt: new Date(),
      processedAt: null,
      failureReason: null,
      attemptCount: 0,
      lastAttemptAt: null,
    });
    try {
      return await this.repository.save(event);
    } catch (error) {
      const driverCode =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (driverCode === '23505') {
        const concurrent = await this.repository.findOne({ where: { contentHash } });
        return concurrent?.status === 'PENDING' ? concurrent : null;
      }
      throw error;
    }
  }
  async registerWithOutbox(
    provider: string,
    contentHash: string,
    payload: Record<string, unknown>,
    outboxEvent: NewOutboxEvent,
  ): Promise<WebhookEventOrmEntity | null> {
    const event = Object.assign(new WebhookEventOrmEntity(), {
      id: UniqueId.create().value,
      provider,
      contentHash,
      payload,
      status: 'PENDING',
      receivedAt: new Date(),
      processedAt: null,
      failureReason: null,
      attemptCount: 0,
      lastAttemptAt: null,
    });
    try {
      await this.repository.manager.transaction(async (manager) => {
        await manager.getRepository(WebhookEventOrmEntity).save(event);
        await manager.getRepository(OutboxEventOrmEntity).save(
          OutboxRepository.createEntity({
            ...outboxEvent,
            aggregateId: event.id,
            payload: { eventId: event.id },
          }),
        );
      });
      return event;
    } catch (error: unknown) {
      const driverCode =
        error instanceof QueryFailedError
          ? (error.driverError as { code?: string }).code
          : undefined;
      if (driverCode !== '23505') throw error;
      const concurrent = await this.repository.findOne({ where: { contentHash } });
      return concurrent?.status === 'PENDING' ? concurrent : null;
    }
  }
  async markProcessed(id: string): Promise<void> {
    await this.repository.update(id, {
      status: 'PROCESSED',
      processedAt: new Date(),
      failureReason: null,
    });
  }
  async markFailed(id: string, reason: string): Promise<void> {
    await this.repository.update(id, { status: 'FAILED', failureReason: reason.slice(0, 4000) });
  }
  async markAttempted(id: string): Promise<void> {
    await this.repository.increment({ id }, 'attemptCount', 1);
    await this.repository.update(id, { lastAttemptAt: new Date() });
  }
  async list(
    page: number,
    pageSize: number,
    status?: string,
  ): Promise<PaginatedResult<WebhookEventOperationDto>> {
    const [items, total] = await this.repository.findAndCount({
      where: status ? { status } : {},
      order: { receivedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
  async requeue(id: string): Promise<WebhookEventOperationDto | null> {
    const event = await this.findById(id);
    if (!event || event.status !== 'FAILED') return null;
    await this.repository.update(id, {
      status: 'PENDING',
      processedAt: null,
      failureReason: null,
    });
    return this.findById(id);
  }
  async requeueWithOutbox(
    id: string,
    outboxEvent: NewOutboxEvent,
  ): Promise<WebhookEventOperationDto | null> {
    return this.repository.manager.transaction(async (manager) => {
      const event = await manager.findOne(WebhookEventOrmEntity, { where: { id } });
      if (!event || event.status !== 'FAILED') return null;
      event.status = 'PENDING';
      event.processedAt = null;
      event.failureReason = null;
      await manager.save(event);
      await manager
        .getRepository(OutboxEventOrmEntity)
        .save(OutboxRepository.createEntity(outboxEvent));
      return event;
    });
  }
  async findById(id: string): Promise<WebhookEventOrmEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
