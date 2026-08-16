import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'email_smtp_configurations' })
export class EmailSmtpConfigurationOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ type: 'varchar', length: 255 }) host!: string;
  @Column({ type: 'int' }) port!: number;
  @Column({ type: 'boolean' }) secure!: boolean;
  @Column({ type: 'varchar', length: 320 }) username!: string;
  @Column({ name: 'password', type: 'text' }) encryptedPassword!: string;
  @Column({ name: 'from_email', type: 'varchar', length: 320 }) fromEmail!: string;
  @Column({ name: 'from_name', type: 'varchar', length: 255 }) fromName!: string;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
