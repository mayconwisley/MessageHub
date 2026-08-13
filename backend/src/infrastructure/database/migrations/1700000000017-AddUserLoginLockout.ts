import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLoginLockout1700000000017 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app.users ADD COLUMN failed_login_attempts integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query('ALTER TABLE app.users ADD COLUMN locked_until timestamptz NULL');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.users DROP COLUMN locked_until');
    await queryRunner.query('ALTER TABLE app.users DROP COLUMN failed_login_attempts');
  }
}
