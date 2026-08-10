import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "applications" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL,
        CONSTRAINT "PK_applications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_applications_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_applications_tenant_id" ON "applications" ("tenant_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "hash" varchar(255) NOT NULL,
        "prefix" varchar(32) NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL,
        "expires_at" timestamptz,
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id"),
        CONSTRAINT "FK_api_keys_application" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_api_keys_application_id" ON "api_keys" ("application_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "whatsapp_accounts" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "waba_id" varchar(255) NOT NULL,
        "access_token" text NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL,
        CONSTRAINT "PK_whatsapp_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsapp_accounts_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_whatsapp_accounts_tenant_id" ON "whatsapp_accounts" ("tenant_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "phone_numbers" (
        "id" uuid NOT NULL,
        "whatsapp_account_id" uuid NOT NULL,
        "phone_number_id" varchar(255) NOT NULL,
        "display_number" varchar(32) NOT NULL,
        "status" varchar(20) NOT NULL,
        "created_at" timestamptz NOT NULL,
        CONSTRAINT "PK_phone_numbers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_phone_numbers_whatsapp_account" FOREIGN KEY ("whatsapp_account_id") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_phone_numbers_whatsapp_account_id" ON "phone_numbers" ("whatsapp_account_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "phone_number_id" uuid NOT NULL,
        "to" varchar(32) NOT NULL,
        "content" text NOT NULL,
        "status" varchar(20) NOT NULL,
        "idempotency_key" varchar(255),
        "provider_message_id" varchar(255),
        "attempt_count" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_application" FOREIGN KEY ("application_id") REFERENCES "applications" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_phone_number" FOREIGN KEY ("phone_number_id") REFERENCES "phone_numbers" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_messages_application_id" ON "messages" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_messages_application_idempotency_key" ON "messages" ("application_id", "idempotency_key") WHERE "idempotency_key" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "message_attempts" (
        "id" uuid NOT NULL,
        "message_id" uuid NOT NULL,
        "attempt_number" int NOT NULL,
        "status" varchar(20) NOT NULL,
        "error_code" varchar(100),
        "error_message" text,
        "occurred_at" timestamptz NOT NULL,
        CONSTRAINT "PK_message_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_message_attempts_message" FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_message_attempts_message_id" ON "message_attempts" ("message_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "message_attempts"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "phone_numbers"`);
    await queryRunner.query(`DROP TABLE "whatsapp_accounts"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
  }
}
