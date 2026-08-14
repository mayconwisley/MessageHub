import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTenantAssignmentCheck1700000000019 implements MigrationInterface {
  name = 'AddUserTenantAssignmentCheck1700000000019';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE app.users
      ADD CONSTRAINT ck_users_tenant_required_unless_platform_admin
      CHECK (role = 'platform_admin' OR tenant_id IS NOT NULL)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE app.users DROP CONSTRAINT ck_users_tenant_required_unless_platform_admin',
    );
  }
}
