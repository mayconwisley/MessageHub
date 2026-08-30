import { MigrationInterface, QueryRunner } from 'typeorm';

/** Índices para as quotas transacionais e para a listagem temporal por aplicação. */
export class AddApplicationTimelineIndexes1700000000025 implements MigrationInterface {
  name = 'AddApplicationTimelineIndexes1700000000025';
  transaction = false;

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY idx_messages_application_id_created_at ON app.messages(application_id, created_at)',
    );
    await queryRunner.query(
      'CREATE INDEX CONCURRENTLY idx_email_messages_application_id_created_at ON app.email_messages(application_id, created_at)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX app.idx_email_messages_application_id_created_at');
    await queryRunner.query('DROP INDEX app.idx_messages_application_id_created_at');
  }
}
