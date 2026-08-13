import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'applications' })
export class ApplicationOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'webhook_url', type: 'text', nullable: true })
  webhookUrl!: string | null;

  @Column({ name: 'webhook_secret', type: 'text', nullable: true })
  webhookSecret!: string | null;

  @Column({ name: 'quota_per_minute', type: 'int', default: 60 })
  quotaPerMinute!: number;

  @Column({ name: 'quota_per_day', type: 'int', default: 10_000 })
  quotaPerDay!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
