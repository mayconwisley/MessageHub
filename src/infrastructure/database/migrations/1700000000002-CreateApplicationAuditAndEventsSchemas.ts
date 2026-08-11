import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApplicationAuditAndEventsSchemas1700000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS app');
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS audit');
    await queryRunner.query('CREATE SCHEMA IF NOT EXISTS events');

    for (const table of [
      'tenants',
      'applications',
      'api_keys',
      'whatsapp_accounts',
      'phone_numbers',
      'messages',
      'message_attempts',
    ]) {
      await queryRunner.query(`ALTER TABLE public."${table}" SET SCHEMA app`);
    }

    await queryRunner.query(`
      CREATE TABLE app.users (
        id uuid PRIMARY KEY,
        tenant_id uuid NULL REFERENCES app.tenants(id) ON DELETE CASCADE,
        name varchar(255) NOT NULL,
        email varchar(320) NOT NULL,
        password_hash varchar(255) NOT NULL,
        role varchar(30) NOT NULL,
        status varchar(20) NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        last_login_at timestamptz NULL,
        CONSTRAINT uq_users_email UNIQUE (email)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_users_tenant_id ON app.users(tenant_id)');

    await queryRunner.query(`
      CREATE TABLE app.user_sessions (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
        token_hash varchar(64) NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz NULL,
        created_at timestamptz NOT NULL,
        last_used_at timestamptz NULL,
        ip_address inet NULL,
        user_agent varchar(1024) NULL
      )
    `);
    await queryRunner.query('CREATE INDEX idx_user_sessions_user_id ON app.user_sessions(user_id)');
    await queryRunner.query('CREATE INDEX idx_user_sessions_active ON app.user_sessions(expires_at) WHERE revoked_at IS NULL');

    await queryRunner.query(`
      CREATE TABLE audit.audit_logs (
        id uuid PRIMARY KEY,
        occurred_at timestamptz NOT NULL,
        actor_user_id uuid NULL,
        actor_email varchar(320) NULL,
        action varchar(120) NOT NULL,
        resource_type varchar(100) NOT NULL,
        resource_id varchar(255) NULL,
        tenant_id uuid NULL,
        request_id varchar(255) NULL,
        ip_address inet NULL,
        user_agent varchar(1024) NULL,
        http_method varchar(10) NOT NULL,
        http_path varchar(2048) NOT NULL,
        http_status int NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await queryRunner.query('CREATE INDEX idx_audit_logs_occurred_at ON audit.audit_logs(occurred_at DESC)');
    await queryRunner.query('CREATE INDEX idx_audit_logs_actor_user_id ON audit.audit_logs(actor_user_id)');
    await queryRunner.query('CREATE INDEX idx_audit_logs_tenant_id ON audit.audit_logs(tenant_id)');

    await queryRunner.query(`
      CREATE TABLE events.outbox_events (
        id uuid PRIMARY KEY,
        event_type varchar(150) NOT NULL,
        aggregate_type varchar(100) NOT NULL,
        aggregate_id varchar(255) NOT NULL,
        tenant_id uuid NULL,
        payload jsonb NOT NULL,
        occurred_at timestamptz NOT NULL,
        processed_at timestamptz NULL,
        failed_at timestamptz NULL,
        failure_reason text NULL
      )
    `);
    await queryRunner.query('CREATE INDEX idx_outbox_events_pending ON events.outbox_events(occurred_at) WHERE processed_at IS NULL');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE events.outbox_events');
    await queryRunner.query('DROP TABLE audit.audit_logs');
    await queryRunner.query('DROP TABLE app.user_sessions');
    await queryRunner.query('DROP TABLE app.users');

    for (const table of [
      'message_attempts',
      'messages',
      'phone_numbers',
      'whatsapp_accounts',
      'api_keys',
      'applications',
      'tenants',
    ]) {
      await queryRunner.query(`ALTER TABLE app."${table}" SET SCHEMA public`);
    }

    await queryRunner.query('DROP SCHEMA events');
    await queryRunner.query('DROP SCHEMA audit');
    await queryRunner.query('DROP SCHEMA app');
  }
}
