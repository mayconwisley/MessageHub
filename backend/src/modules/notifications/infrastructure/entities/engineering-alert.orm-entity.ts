import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'events', name: 'engineering_alerts' })
@Index(['severity', 'occurredAt'])
export class EngineeringAlertOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 100 }) type!: string;
  @Column({ type: 'varchar', length: 20 }) severity!: string;
  @Column({ type: 'varchar', length: 255 }) title!: string;
  @Column({ type: 'text' }) message!: string;
  @Column({ type: 'jsonb', default: {} }) metadata!: Record<string, unknown>;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt!: Date | null;
}
