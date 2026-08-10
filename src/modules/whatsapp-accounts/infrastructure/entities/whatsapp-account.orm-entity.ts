import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'whatsapp_accounts' })
export class WhatsAppAccountOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'waba_id', type: 'varchar', length: 255 })
  wabaId!: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
