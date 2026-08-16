import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailDelivery1700000000021 implements MigrationInterface {
  name = 'CreateEmailDelivery1700000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE app."email_smtp_configurations" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "host" varchar(255) NOT NULL,
        "port" int NOT NULL,
        "secure" boolean NOT NULL,
        "username" varchar(320) NOT NULL,
        "password" text NOT NULL,
        "from_email" varchar(320) NOT NULL,
        "from_name" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "PK_email_smtp_configurations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_smtp_configurations_tenant" UNIQUE ("tenant_id"),
        CONSTRAINT "FK_email_smtp_configurations_tenant" FOREIGN KEY ("tenant_id") REFERENCES app."tenants" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_email_smtp_configurations_port" CHECK ("port" BETWEEN 1 AND 65535)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE app."email_messages" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "application_id" uuid NOT NULL,
        "to" varchar(320) NOT NULL,
        "subject" varchar(255) NOT NULL,
        "text_body" text,
        "html_body" text,
        "status" varchar(20) NOT NULL,
        "idempotency_key" varchar(255),
        "provider_message_id" varchar(255),
        "request_id" varchar(255),
        "attempt_count" int NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL,
        "updated_at" timestamptz NOT NULL,
        CONSTRAINT "PK_email_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_messages_tenant" FOREIGN KEY ("tenant_id") REFERENCES app."tenants" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_email_messages_application" FOREIGN KEY ("application_id") REFERENCES app."applications" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_email_messages_body" CHECK ("text_body" IS NOT NULL OR "html_body" IS NOT NULL)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_email_messages_application_id" ON app."email_messages" ("application_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_email_messages_application_idempotency_key" ON app."email_messages" ("application_id", "idempotency_key") WHERE "idempotency_key" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE app."email_attempts" (
        "id" uuid NOT NULL,
        "email_message_id" uuid NOT NULL,
        "attempt_number" int NOT NULL,
        "status" varchar(20) NOT NULL,
        "error_code" varchar(100),
        "error_message" text,
        "occurred_at" timestamptz NOT NULL,
        CONSTRAINT "PK_email_attempts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_email_attempts_message" FOREIGN KEY ("email_message_id") REFERENCES app."email_messages" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_email_attempts_message_id" ON app."email_attempts" ("email_message_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE app."email_attempts"`);
    await queryRunner.query(`DROP TABLE app."email_messages"`);
    await queryRunner.query(`DROP TABLE app."email_smtp_configurations"`);
  }
}
