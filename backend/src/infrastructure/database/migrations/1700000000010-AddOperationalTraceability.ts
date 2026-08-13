import { MigrationInterface, QueryRunner } from 'typeorm';

/** Dados de operação são aditivos para preservar compatibilidade com integrações existentes. */
export class AddOperationalTraceability1700000000010 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.messages ADD COLUMN request_id varchar(255) NULL');
    await queryRunner.query('CREATE INDEX idx_messages_request_id ON app.messages(request_id)');
    await queryRunner.query(
      'CREATE INDEX idx_messages_provider_message_id ON app.messages(provider_message_id)',
    );
    await queryRunner.query(`
      CREATE TABLE app.message_timeline_events (
        id uuid PRIMARY KEY,
        message_id uuid NOT NULL REFERENCES app.messages(id) ON DELETE CASCADE,
        event_type varchar(80) NOT NULL,
        status varchar(30) NOT NULL,
        source varchar(40) NOT NULL,
        attempt_number int NULL,
        error_code varchar(100) NULL,
        error_message text NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        occurred_at timestamptz NOT NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX idx_message_timeline_events_message_occurred_at ON app.message_timeline_events(message_id, occurred_at)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE app.message_timeline_events');
    await queryRunner.query('DROP INDEX app.idx_messages_provider_message_id');
    await queryRunner.query('DROP INDEX app.idx_messages_request_id');
    await queryRunner.query('ALTER TABLE app.messages DROP COLUMN request_id');
  }
}
