import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDurableOutboxScheduling1700000000024 implements MigrationInterface {
  name = 'AddDurableOutboxScheduling1700000000024';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE events.outbox_events ADD COLUMN available_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN locked_until timestamptz NULL, ADD COLUMN attempt_count integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'CREATE INDEX idx_outbox_events_dispatchable ON events.outbox_events(available_at) WHERE processed_at IS NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX events.idx_outbox_events_dispatchable');
    await queryRunner.query(
      'ALTER TABLE events.outbox_events DROP COLUMN attempt_count, DROP COLUMN locked_until, DROP COLUMN available_at',
    );
  }
}
