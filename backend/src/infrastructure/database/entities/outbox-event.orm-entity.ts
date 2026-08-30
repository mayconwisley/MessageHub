import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'events', name: 'outbox_events' })
export class OutboxEventOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'event_type', type: 'varchar', length: 150 }) eventType!: string;
  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 }) aggregateType!: string;
  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 }) aggregateId!: string;
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true }) tenantId!: string | null;
  @Column({ type: 'jsonb' }) payload!: Record<string, unknown>;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
  @Column({ name: 'available_at', type: 'timestamptz' }) availableAt!: Date;
  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true }) processedAt!: Date | null;
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true }) lockedUntil!: Date | null;
  @Column({ name: 'attempt_count', type: 'integer' }) attemptCount!: number;
  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true }) failedAt!: Date | null;
  @Column({ name: 'failure_reason', type: 'text', nullable: true }) failureReason!: string | null;
}
