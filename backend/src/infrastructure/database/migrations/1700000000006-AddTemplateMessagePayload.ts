import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateMessagePayload1700000000006 implements MigrationInterface {
  name = 'AddTemplateMessagePayload1700000000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app.messages ADD COLUMN type varchar(20) NOT NULL DEFAULT 'TEXT'`);
    await queryRunner.query(`ALTER TABLE app.messages ADD COLUMN template jsonb NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE app.messages DROP COLUMN template');
    await queryRunner.query('ALTER TABLE app.messages DROP COLUMN type');
  }
}
