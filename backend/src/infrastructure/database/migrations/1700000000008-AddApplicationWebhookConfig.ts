import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationWebhookConfig1700000000008 implements MigrationInterface {
  name = 'AddApplicationWebhookConfig1700000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.applications ADD COLUMN webhook_url text NULL');
    await queryRunner.query('ALTER TABLE app.applications ADD COLUMN webhook_secret text NULL');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.applications DROP COLUMN webhook_secret');
    await queryRunner.query('ALTER TABLE app.applications DROP COLUMN webhook_url');
  }
}
