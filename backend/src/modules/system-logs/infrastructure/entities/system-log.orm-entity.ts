import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'events', name: 'system_logs' })
@Index(['level', 'occurredAt'])
export class SystemLogOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
  @Column({ type: 'varchar', length: 10 }) level!: string;
  @Column({ type: 'varchar', length: 200, nullable: true }) context!: string | null;
  @Column({ type: 'text' }) message!: string;
  @Column({ name: 'request_id', type: 'varchar', length: 255, nullable: true }) requestId!:
    string | null;
  @Column({ type: 'jsonb', default: {} }) metadata!: Record<string, unknown>;
}
