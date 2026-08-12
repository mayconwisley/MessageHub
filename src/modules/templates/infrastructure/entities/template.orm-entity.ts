import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { TemplateComponentDefinition } from '../../application/ports/template-provider.interface';

@Entity({ schema: 'app', name: 'message_templates' })
@Index(['tenantId', 'whatsAppAccountId', 'metaTemplateId'], {
  unique: true,
  where: '"meta_template_id" IS NOT NULL',
})
@Index(['tenantId', 'whatsAppAccountId', 'name', 'language'], { unique: true })
export class TemplateOrmEntity {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'whatsapp_account_id', type: 'uuid' }) whatsAppAccountId!: string;
  @Column({ name: 'meta_template_id', type: 'varchar', length: 255, nullable: true })
  metaTemplateId!: string | null;
  @Column({ type: 'varchar', length: 512 }) name!: string;
  @Column({ type: 'varchar', length: 50 }) language!: string;
  @Column({ type: 'varchar', length: 50 }) category!: string;
  @Column({ type: 'jsonb' }) components!: TemplateComponentDefinition[];
  @Column({ name: 'parameter_format', type: 'varchar', length: 30, nullable: true })
  parameterFormat!: string | null;
  @Column({ type: 'varchar', length: 20 }) status!: string;
  @Column({ name: 'rejected_reason', type: 'text', nullable: true }) rejectedReason!: string | null;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError!: string | null;
  @Column({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @Column({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
