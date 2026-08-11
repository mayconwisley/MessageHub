import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'messages' })
@Index(['applicationId', 'idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
export class MessageOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'phone_number_id', type: 'uuid' })
  phoneNumberId!: string;

  @Column({ type: 'varchar', length: 32 })
  to!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId!: string | null;

  @Column({ name: 'attempt_count', type: 'int', default: 0 })
  attemptCount!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
