import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagesMissingIndexes1700000000020 implements MigrationInterface {
  name = 'AddMessagesMissingIndexes1700000000020';
  // CONCURRENTLY não pode rodar dentro de uma transação.
  transaction = false;

  async up(queryRunner: QueryRunner): Promise<void> {
    // Usado pelo dashboard para agregações por tenant em uma janela de tempo
    // (WHERE tenant_id = ... AND created_at >= ... ORDER BY created_at).
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY idx_messages_tenant_id_created_at ON app.messages(tenant_id, created_at)',
    );
    // Cobre a FK phone_number_id: lookups de mensagens por número e o scan feito
    // pelo ON DELETE CASCADE ao remover um phone_number.
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY idx_messages_phone_number_id ON app.messages(phone_number_id)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Sem CONCURRENTLY aqui: `migration:revert` do TypeORM sempre roda o down()
    // dentro de uma transação (ignora `transaction = false` nesse caminho, ao
    // contrário do up()), e DROP INDEX CONCURRENTLY não pode rodar em transação.
    // Isso é seguro porque, ao contrário do CREATE, o DROP só precisa de um lock
    // exclusivo breve para remover o metadado do índice.
    await queryRunner.query('DROP INDEX app.idx_messages_phone_number_id');
    await queryRunner.query('DROP INDEX app.idx_messages_tenant_id_created_at');
  }
}
