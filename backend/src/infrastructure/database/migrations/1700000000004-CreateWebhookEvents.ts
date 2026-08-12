import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebhookEvents1700000000004 implements MigrationInterface {
  name = 'CreateWebhookEvents1700000000004';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE events.webhook_events (
      id uuid PRIMARY KEY, provider varchar(50) NOT NULL, content_hash char(64) NOT NULL,
      payload jsonb NOT NULL, status varchar(20) NOT NULL, received_at timestamptz NOT NULL,
      processed_at timestamptz NULL, failure_reason text NULL
    )`);
    await queryRunner.query(
      'CREATE UNIQUE INDEX uq_webhook_events_content_hash ON events.webhook_events(content_hash)',
    );
    await queryRunner.query(
      "CREATE INDEX idx_webhook_events_pending ON events.webhook_events(received_at) WHERE status = 'PENDING'",
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE events.webhook_events');
  }
}
