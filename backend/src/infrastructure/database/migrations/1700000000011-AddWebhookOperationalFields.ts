import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebhookOperationalFields1700000000011 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE events.webhook_events ADD COLUMN attempt_count int NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE events.webhook_events ADD COLUMN last_attempt_at timestamptz NULL',
    );
    await queryRunner.query(
      'CREATE INDEX idx_webhook_events_status_received_at ON events.webhook_events(status, received_at DESC)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX events.idx_webhook_events_status_received_at');
    await queryRunner.query('ALTER TABLE events.webhook_events DROP COLUMN last_attempt_at');
    await queryRunner.query('ALTER TABLE events.webhook_events DROP COLUMN attempt_count');
  }
}
