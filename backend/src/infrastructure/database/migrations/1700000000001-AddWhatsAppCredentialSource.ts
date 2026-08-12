import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsAppCredentialSource1700000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_accounts"
      ADD COLUMN "credential_source" varchar(20) NOT NULL DEFAULT 'tenant'
    `);
    await queryRunner.query(`
      ALTER TABLE "whatsapp_accounts"
      ALTER COLUMN "access_token" DROP NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "whatsapp_accounts"
      DROP COLUMN "credential_source"
    `);
    await queryRunner.query(`
      ALTER TABLE "whatsapp_accounts"
      ALTER COLUMN "access_token" SET NOT NULL
    `);
  }
}
