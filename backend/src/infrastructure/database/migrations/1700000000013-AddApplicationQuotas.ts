import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationQuotas1700000000013 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app.applications ADD COLUMN quota_per_minute int NOT NULL DEFAULT 60',
    );
    await queryRunner.query(
      'ALTER TABLE app.applications ADD COLUMN quota_per_day int NOT NULL DEFAULT 10000',
    );
    await queryRunner.query(
      'ALTER TABLE app.applications ADD CONSTRAINT chk_applications_quotas_positive CHECK (quota_per_minute > 0 AND quota_per_day > 0)',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app.applications DROP CONSTRAINT chk_applications_quotas_positive',
    );
    await queryRunner.query('ALTER TABLE app.applications DROP COLUMN quota_per_day');
    await queryRunner.query('ALTER TABLE app.applications DROP COLUMN quota_per_minute');
  }
}
