import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Repository } from 'typeorm';
import {
  EmailTimelineEventDto,
  IEmailTimelineRepository,
  RecordEmailTimelineEventInput,
} from '../../application/ports/email-timeline.repository.interface';
import { EmailTimelineEventOrmEntity } from '../entities/email-timeline-event.orm-entity';

@Injectable()
export class PostgresEmailTimelineRepository implements IEmailTimelineRepository {
  constructor(
    @InjectRepository(EmailTimelineEventOrmEntity)
    private readonly repository: Repository<EmailTimelineEventOrmEntity>,
  ) {}

  async record(input: RecordEmailTimelineEventInput): Promise<void> {
    const event = this.repository.create({
      id: uuidv7(),
      emailMessageId: input.emailMessageId,
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

  async listByEmailMessageId(emailMessageId: string): Promise<EmailTimelineEventDto[]> {
    const rows = await this.repository.find({
      where: { emailMessageId },
      order: { occurredAt: 'ASC' },
    });
    return rows.map((row) => ({
      id: row.id,
      emailMessageId: row.emailMessageId,
      eventType: row.eventType,
      status: row.status,
      source: row.source as EmailTimelineEventDto['source'],
      attemptNumber: row.attemptNumber,
      errorCode: row.errorCode,
      errorMessage: row.errorMessage,
      metadata: row.metadata,
      occurredAt: row.occurredAt,
    }));
  }
}
