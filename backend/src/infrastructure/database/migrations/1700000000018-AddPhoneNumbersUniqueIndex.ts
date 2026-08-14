import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumbersUniqueIndex1700000000018 implements MigrationInterface {
  name = 'AddPhoneNumbersUniqueIndex1700000000018';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX uq_phone_numbers_phone_number_id ON app.phone_numbers(phone_number_id)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX app.uq_phone_numbers_phone_number_id');
  }
}
