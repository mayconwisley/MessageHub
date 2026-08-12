import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppWebhookAppSecret1700000000005 implements MigrationInterface {
  name = 'AddWhatsAppWebhookAppSecret1700000000005';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.whatsapp_accounts ADD COLUMN app_secret text NULL');
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.whatsapp_accounts DROP COLUMN app_secret');
  }
}
