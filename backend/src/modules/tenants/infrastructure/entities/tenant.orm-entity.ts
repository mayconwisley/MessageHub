import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'tenants' })
export class TenantOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'data_retention_days', type: 'int', default: 90 })
  dataRetentionDays!: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
