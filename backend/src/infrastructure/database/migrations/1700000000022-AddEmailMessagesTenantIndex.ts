import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailMessagesTenantIndex1700000000022 implements MigrationInterface {
  name = 'AddEmailMessagesTenantIndex1700000000022';
  // CONCURRENTLY não pode rodar dentro de uma transação.
  transaction = false;

  async up(queryRunner: QueryRunner): Promise<void> {
    // Cobre consultas/relatórios de histórico de e-mail por tenant
    // (WHERE tenant_id = ... ORDER BY created_at), no mesmo padrão usado em app.messages.
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY idx_email_messages_tenant_id_created_at ON app.email_messages(tenant_id, created_at)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Sem CONCURRENTLY aqui: `migration:revert` do TypeORM sempre roda o down()
    // dentro de uma transação, e DROP INDEX CONCURRENTLY não pode rodar em transação.
    await queryRunner.query('DROP INDEX app.idx_email_messages_tenant_id_created_at');
  }
}
