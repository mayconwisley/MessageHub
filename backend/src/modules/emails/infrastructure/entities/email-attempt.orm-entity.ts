import { Column, Entity, PrimaryColumn } from 'typeorm';
@Entity({ schema: 'app', name: 'email_attempts' })
export class EmailAttemptOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'email_message_id', type: 'uuid' }) emailMessageId!: string;
  @Column({ name: 'attempt_number', type: 'int' }) attemptNumber!: number;
  @Column({ type: 'varchar', length: 20 }) status!: string;
  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true }) errorCode!:
    string | null;
  @Column({ name: 'error_message', type: 'text', nullable: true }) errorMessage!: string | null;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
}
