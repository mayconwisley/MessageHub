import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'events', name: 'webhook_events' })
@Index(['contentHash'], { unique: true })
export class WebhookEventOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 50 }) provider!: string;
  @Column({ name: 'content_hash', type: 'char', length: 64 }) contentHash!: string;
  @Column({ type: 'jsonb' }) payload!: Record<string, unknown>;
  @Column({ type: 'varchar', length: 20 }) status!: string;
  @Column({ name: 'received_at', type: 'timestamptz' }) receivedAt!: Date;
  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true }) processedAt!: Date | null;
  @Column({ name: 'failure_reason', type: 'text', nullable: true }) failureReason!: string | null;
}
