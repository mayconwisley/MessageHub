import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSharedThrottlerStorage1700000000026 implements MigrationInterface {
  name = 'CreateSharedThrottlerStorage1700000000026';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE events.throttler_entries (
        throttler_key varchar(1024) NOT NULL,
        throttler_name varchar(100) NOT NULL,
        hits integer NOT NULL,
        expires_at timestamptz NOT NULL,
        blocked_until timestamptz NULL,
        PRIMARY KEY (throttler_key, throttler_name)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX idx_throttler_entries_expiration ON events.throttler_entries(expires_at)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE events.throttler_entries');
  }
}
