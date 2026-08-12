import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'app', name: 'application_phone_numbers' })
export class ApplicationPhoneNumberLinkOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'application_id', type: 'uuid' })
  applicationId!: string;

  @Column({ name: 'phone_number_id', type: 'uuid' })
  phoneNumberId!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
