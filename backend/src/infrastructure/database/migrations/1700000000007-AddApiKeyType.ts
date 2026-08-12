import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyType1700000000007 implements MigrationInterface {
  name = 'AddApiKeyType1700000000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE app.api_keys ADD COLUMN type varchar(20) NOT NULL DEFAULT 'platform'",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.api_keys DROP COLUMN type');
  }
}
