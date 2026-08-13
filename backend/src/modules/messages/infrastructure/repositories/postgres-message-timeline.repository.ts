import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import {
  IMessageTimelineRepository,
  MessageTimelineEventDto,
  RecordMessageTimelineEventInput,
} from '../../application/ports/message-timeline.repository.interface';
import { MessageTimelineEventOrmEntity } from '../entities/message-timeline-event.orm-entity';

@Injectable()
export class PostgresMessageTimelineRepository implements IMessageTimelineRepository {
  constructor(
    @InjectRepository(MessageTimelineEventOrmEntity)
    private readonly repository: Repository<MessageTimelineEventOrmEntity>,
  ) {}

  async record(input: RecordMessageTimelineEventInput): Promise<void> {
    const event = this.repository.create({
      id: randomUUID(),
      messageId: input.messageId,
      eventType: input.eventType,
      status: input.status,
      source: input.source,
      attemptNumber: input.attemptNumber ?? null,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage?.slice(0, 4000) ?? null,
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
    });
    await this.repository.save(event);
  }

  async listByMessageId(messageId: string): Promise<MessageTimelineEventDto[]> {
    const rows = await this.repository.find({
      where: { messageId },
      order: { occurredAt: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      messageId: row.messageId,
      eventType: row.eventType,
      status: row.status,
      source: row.source as MessageTimelineEventDto['source'],
      attemptNumber: row.attemptNumber,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      metadata: row.metadata,
      occurredAt: row.occurredAt,
    }));
  }
}
