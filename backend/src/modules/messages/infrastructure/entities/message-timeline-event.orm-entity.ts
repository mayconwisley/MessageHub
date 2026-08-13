import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/** Registro imutável da trajetória operacional de uma mensagem. */
@Entity({ schema: 'app', name: 'message_timeline_events' })
@Index(['messageId', 'occurredAt'])
export class MessageTimelineEventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 80 })
  eventType!: string;

  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ type: 'varchar', length: 40 })
  source!: string;

  @Column({ name: 'attempt_number', type: 'int', nullable: true })
  attemptNumber!: number | null;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
