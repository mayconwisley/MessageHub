import { MigrationInterface, QueryRunner } from 'typeorm';

/** Espelha app.message_timeline_events (secao 21/22/51) para trazer o e-mail
 * ao mesmo padrão de observabilidade operacional do WhatsApp. */
export class CreateEmailTimelineEvents1700000000023 implements MigrationInterface {
  name = 'CreateEmailTimelineEvents1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE app.email_timeline_events (
        id uuid PRIMARY KEY,
        email_message_id uuid NOT NULL REFERENCES app.email_messages(id) ON DELETE CASCADE,
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
      'CREATE INDEX idx_email_timeline_events_email_message_occurred_at ON app.email_timeline_events(email_message_id, occurred_at)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE app.email_timeline_events');
  }
}
