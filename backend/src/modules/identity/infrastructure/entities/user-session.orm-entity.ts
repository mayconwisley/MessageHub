import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'user_sessions' })
export class UserSessionOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId!: string;
  @Column({ name: 'token_hash', type: 'varchar', length: 64, unique: true }) tokenHash!: string;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt!: Date;
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt!: Date | null;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true }) lastUsedAt!: Date | null;
  @Column({ name: 'ip_address', type: 'inet', nullable: true }) ipAddress!: string | null;
  @Column({ name: 'user_agent', type: 'varchar', length: 1024, nullable: true }) userAgent!:
    string | null;
}
