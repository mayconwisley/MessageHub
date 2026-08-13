import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateEngineeringAlerts1700000000015 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE events.engineering_alerts (id uuid PRIMARY KEY, type varchar(100) NOT NULL, severity varchar(20) NOT NULL, title varchar(255) NOT NULL, message text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL, dispatched_at timestamptz NULL)`,
    );
    await queryRunner.query(
      'CREATE INDEX idx_engineering_alerts_severity_occurred_at ON events.engineering_alerts(severity, occurred_at DESC)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE events.engineering_alerts');
  }
}
