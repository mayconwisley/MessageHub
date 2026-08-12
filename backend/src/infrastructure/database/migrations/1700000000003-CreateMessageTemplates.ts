import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageTemplates1700000000003 implements MigrationInterface {
  name = 'CreateMessageTemplates1700000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE app.message_templates (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
        whatsapp_account_id uuid NOT NULL REFERENCES app.whatsapp_accounts(id) ON DELETE CASCADE,
        meta_template_id varchar(255) NULL,
        name varchar(512) NOT NULL,
        language varchar(50) NOT NULL,
        category varchar(50) NOT NULL,
        components jsonb NOT NULL,
        parameter_format varchar(30) NULL,
        status varchar(20) NOT NULL,
        rejected_reason text NULL,
        last_error text NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_message_templates_meta_id ON app.message_templates(tenant_id, whatsapp_account_id, meta_template_id) WHERE meta_template_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_message_templates_name_language ON app.message_templates(tenant_id, whatsapp_account_id, name, language)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_message_templates_account_status ON app.message_templates(whatsapp_account_id, status)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE app.message_templates');
  }
}
