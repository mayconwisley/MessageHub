import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'audit', name: 'audit_logs' })
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true }) actorUserId!: string | null;
  @Column({ name: 'actor_email', type: 'varchar', length: 320, nullable: true }) actorEmail!:
    string | null;
  @Column({ type: 'varchar', length: 120 }) action!: string;
  @Column({ name: 'resource_type', type: 'varchar', length: 100 }) resourceType!: string;
  @Column({ name: 'resource_id', type: 'varchar', length: 255, nullable: true }) resourceId!:
    string | null;
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true }) tenantId!: string | null;
  @Column({ name: 'request_id', type: 'varchar', length: 255, nullable: true }) requestId!:
    string | null;
  @Column({ name: 'http_method', type: 'varchar', length: 10 }) httpMethod!: string;
  @Column({ name: 'http_path', type: 'varchar', length: 2048 }) httpPath!: string;
  @Column({ name: 'http_status', type: 'int' }) httpStatus!: number;
  @Column({ type: 'jsonb' }) metadata!: Record<string, unknown>;
}
