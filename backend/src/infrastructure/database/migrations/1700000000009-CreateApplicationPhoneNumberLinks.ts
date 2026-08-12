import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplicationPhoneNumberLinks1700000000009 implements MigrationInterface {
  name = 'CreateApplicationPhoneNumberLinks1700000000009';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE app.application_phone_numbers (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL REFERENCES app.applications(id) ON DELETE CASCADE,
      phone_number_id uuid NOT NULL REFERENCES app.phone_numbers(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL
    )`);
    await queryRunner.query(
      'CREATE UNIQUE INDEX uq_application_phone_numbers_pair ON app.application_phone_numbers(application_id, phone_number_id)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_application_phone_numbers_phone_number_id ON app.application_phone_numbers(phone_number_id)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE app.application_phone_numbers');
  }
}
