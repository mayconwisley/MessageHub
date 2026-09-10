import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataRetentionPolicy1700000000027 implements MigrationInterface {
  name = 'AddDataRetentionPolicy1700000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app.tenants
      ADD COLUMN data_retention_days int NOT NULL DEFAULT 90,
      ADD CONSTRAINT chk_tenants_data_retention_days CHECK (data_retention_days BETWEEN 1 AND 3650)
    `);
    await queryRunner.query(
      'CREATE INDEX idx_messages_tenant_created_at ON app.messages(tenant_id, created_at)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_email_messages_tenant_created_at ON app.email_messages(tenant_id, created_at)',
    );
    await queryRunner.query('ALTER TABLE events.webhook_events ADD COLUMN tenant_id uuid NULL');
    await queryRunner.query(
      'ALTER TABLE events.webhook_events ADD CONSTRAINT fk_webhook_events_tenant FOREIGN KEY (tenant_id) REFERENCES app.tenants(id) ON DELETE SET NULL',
    );
    await queryRunner.query(
      'CREATE INDEX idx_webhook_events_tenant_received_at ON events.webhook_events(tenant_id, received_at)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX events.idx_webhook_events_tenant_received_at');
    await queryRunner.query(
      'ALTER TABLE events.webhook_events DROP CONSTRAINT fk_webhook_events_tenant',
    );
    await queryRunner.query('ALTER TABLE events.webhook_events DROP COLUMN tenant_id');
    await queryRunner.query('DROP INDEX app.idx_email_messages_tenant_created_at');
    await queryRunner.query('DROP INDEX app.idx_messages_tenant_created_at');
    await queryRunner.query(
      'ALTER TABLE app.tenants DROP CONSTRAINT chk_tenants_data_retention_days',
    );
    await queryRunner.query('ALTER TABLE app.tenants DROP COLUMN data_retention_days');
  }
}
