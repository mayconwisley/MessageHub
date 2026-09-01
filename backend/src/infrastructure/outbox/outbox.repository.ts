import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Repository } from 'typeorm';
import { NewOutboxEvent } from '@shared/outbox';
import { OutboxEventOrmEntity } from '../database/entities/outbox-event.orm-entity';

const CLAIM_LEASE_SECONDS = 60;

@Injectable()
export class OutboxRepository {
  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly events: Repository<OutboxEventOrmEntity>,
  ) {}

  static createEntity(event: NewOutboxEvent): OutboxEventOrmEntity {
    const row = new OutboxEventOrmEntity();
    row.id = uuidv7();
    row.eventType = event.eventType;
    row.aggregateType = event.aggregateType;
    row.aggregateId = event.aggregateId;
    row.tenantId = event.tenantId ?? null;
    row.payload = event.payload;
    row.occurredAt = new Date();
    row.availableAt = event.availableAt ?? row.occurredAt;
    row.processedAt = null;
    row.lockedUntil = null;
    row.attemptCount = 0;
    row.failedAt = null;
    row.failureReason = null;
    return row;
  }

  async add(event: NewOutboxEvent): Promise<void> {
    await this.events.save(OutboxRepository.createEntity(event));
  }

  async claimBatch(limit: number): Promise<OutboxEventOrmEntity[]> {
    const [rows] = await this.events.query<[OutboxEventOrmEntity[], number]>(
      `WITH candidates AS (
         SELECT id
         FROM events.outbox_events
         WHERE processed_at IS NULL
           AND failed_at IS NULL
           AND available_at <= now()
           AND (locked_until IS NULL OR locked_until < now())
         ORDER BY occurred_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       UPDATE events.outbox_events event
       SET locked_until = now() + ($2 * interval '1 second'),
           attempt_count = event.attempt_count + 1
       FROM candidates
       WHERE event.id = candidates.id
       RETURNING
         event.id,
         event.event_type AS "eventType",
         event.aggregate_type AS "aggregateType",
         event.aggregate_id AS "aggregateId",
         event.tenant_id AS "tenantId",
         event.payload,
         event.occurred_at AS "occurredAt",
         event.available_at AS "availableAt",
         event.processed_at AS "processedAt",
         event.locked_until AS "lockedUntil",
         event.attempt_count AS "attemptCount",
         event.failed_at AS "failedAt",
         event.failure_reason AS "failureReason"`,
      [limit, CLAIM_LEASE_SECONDS],
    );
    return rows;
  }

  async markProcessed(id: string): Promise<void> {
    await this.events.update(id, {
      processedAt: new Date(),
      lockedUntil: null,
      failureReason: null,
    });
  }

  async reschedule(id: string, attemptCount: number, reason: string): Promise<void> {
    if (attemptCount >= 25) {
      await this.events.update(id, {
        failedAt: new Date(),
        lockedUntil: null,
        failureReason: reason.slice(0, 4000),
      });
      return;
    }
    const seconds = Math.min(900, 2 ** Math.min(attemptCount, 9));
    await this.events.update(id, {
      availableAt: new Date(Date.now() + seconds * 1000),
      lockedUntil: null,
      failureReason: reason.slice(0, 4000),
    });
  }
}
