import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
@Entity({ schema: 'app', name: 'email_messages' })
@Index(['applicationId', 'idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
export class EmailMessageOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'application_id', type: 'uuid' }) applicationId!: string;
  @Column({ type: 'varchar', length: 320 }) to!: string;
  @Column({ type: 'varchar', length: 255 }) subject!: string;
  @Column({ name: 'text_body', type: 'text', nullable: true }) textBody!: string | null;
  @Column({ name: 'html_body', type: 'text', nullable: true }) htmlBody!: string | null;
  @Column({ type: 'varchar', length: 20 }) status!: string;
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, nullable: true })
  idempotencyKey!: string | null;
  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId!: string | null;
  @Column({ name: 'request_id', type: 'varchar', length: 255, nullable: true }) requestId!:
    string | null;
  @Column({ name: 'attempt_count', type: 'int' }) attemptCount!: number;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
