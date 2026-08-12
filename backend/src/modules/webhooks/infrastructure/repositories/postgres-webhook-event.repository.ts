import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { QueryFailedError, Repository } from 'typeorm';
import { WebhookEventOrmEntity } from '../entities/webhook-event.orm-entity';

export interface IWebhookEventRepository {
  register(
    provider: string,
    contentHash: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookEventOrmEntity | null>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, reason: string): Promise<void>;
  findById(id: string): Promise<WebhookEventOrmEntity | null>;
}
export const WEBHOOK_EVENT_REPOSITORY = Symbol('WEBHOOK_EVENT_REPOSITORY');

@Injectable()
export class PostgresWebhookEventRepository implements IWebhookEventRepository {
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
  async findById(id: string): Promise<WebhookEventOrmEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
