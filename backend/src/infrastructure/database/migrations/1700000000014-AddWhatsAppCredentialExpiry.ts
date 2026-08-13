import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddWhatsAppCredentialExpiry1700000000014 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app.whatsapp_accounts ADD COLUMN credential_expires_at timestamptz NULL',
    );
    await queryRunner.query(
      'CREATE INDEX idx_whatsapp_accounts_credential_expiry ON app.whatsapp_accounts(credential_expires_at) WHERE credential_expires_at IS NOT NULL',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX app.idx_whatsapp_accounts_credential_expiry');
    await queryRunner.query('ALTER TABLE app.whatsapp_accounts DROP COLUMN credential_expires_at');
  }
}
