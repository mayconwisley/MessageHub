import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'users' })
export class UserOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true }) tenantId!: string | null;
  @Column({ type: 'varchar', length: 255 }) name!: string;
  @Column({ type: 'varchar', length: 320, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255 }) passwordHash!: string;
  @Column({ type: 'varchar', length: 30 }) role!: string;
  @Column({ type: 'varchar', length: 20 }) status!: string;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true }) lastLoginAt!: Date | null;
}
