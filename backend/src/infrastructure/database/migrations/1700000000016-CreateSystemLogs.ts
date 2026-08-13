import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateSystemLogs1700000000016 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE events.system_logs (id uuid PRIMARY KEY, occurred_at timestamptz NOT NULL, level varchar(10) NOT NULL, context varchar(200) NULL, message text NOT NULL, request_id varchar(255) NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb)`,
    );
    await queryRunner.query(
      'CREATE INDEX idx_system_logs_occurred_at ON events.system_logs(occurred_at DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX idx_system_logs_level_occurred_at ON events.system_logs(level, occurred_at DESC)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE events.system_logs');
  }
}
