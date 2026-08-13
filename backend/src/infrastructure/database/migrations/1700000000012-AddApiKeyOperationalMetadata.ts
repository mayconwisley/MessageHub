import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApiKeyOperationalMetadata1700000000012 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE app.api_keys ADD COLUMN scopes text[] NOT NULL DEFAULT ARRAY['messages:write', 'messages:read']::text[]",
    );
    await queryRunner.query('ALTER TABLE app.api_keys ADD COLUMN last_used_at timestamptz NULL');
    await queryRunner.query('ALTER TABLE app.api_keys ADD COLUMN last_used_ip inet NULL');
    await queryRunner.query(
      "CREATE INDEX idx_api_keys_expiring ON app.api_keys(expires_at) WHERE status = 'ACTIVE'",
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX app.idx_api_keys_expiring');
    await queryRunner.query('ALTER TABLE app.api_keys DROP COLUMN last_used_ip');
    await queryRunner.query('ALTER TABLE app.api_keys DROP COLUMN last_used_at');
    await queryRunner.query('ALTER TABLE app.api_keys DROP COLUMN scopes');
  }
}
