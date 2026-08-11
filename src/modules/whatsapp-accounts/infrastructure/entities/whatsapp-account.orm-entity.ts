import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'whatsapp_accounts' })
export class WhatsAppAccountOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'waba_id', type: 'varchar', length: 255 })
  wabaId!: string;

  @Column({ name: 'credential_source', type: 'varchar', length: 20 })
  credentialSource!: string;

  @Column({ name: 'access_token', type: 'text', nullable: true })
  encryptedAccessToken!: string | null;

  @Column({ name: 'app_secret', type: 'text', nullable: true })
  encryptedAppSecret!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
