import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'phone_numbers' })
export class PhoneNumberOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'whatsapp_account_id', type: 'uuid' })
  whatsAppAccountId!: string;

  @Column({ name: 'phone_number_id', type: 'varchar', length: 255 })
  phoneNumberId!: string;

  @Column({ name: 'display_number', type: 'varchar', length: 32 })
  displayNumber!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
