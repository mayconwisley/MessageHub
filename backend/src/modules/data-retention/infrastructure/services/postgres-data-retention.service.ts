import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

const BATCH_SIZE = 1_000;
const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DATA_RETENTION_DAYS = 90;
const ADVISORY_LOCK_KEY = 8_135_402;

interface RetentionRunResult {
  messages: number;
  emails: number;
  webhooks: number;
  auditLogs: number;
}

interface AdvisoryLockRow {
  acquired?: unknown;
}

@Injectable()
export class PostgresDataRetentionService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PostgresDataRetentionService.name);
  }

  onApplicationBootstrap(): void {
    void this.run();
    this.timer = setInterval(() => void this.run(), RUN_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async run(): Promise<RetentionRunResult | null> {
    if (this.isRunning) return null;
    this.isRunning = true;
    let acquired = false;
    try {
      acquired = await this.tryAcquireLock();
      if (!acquired) return null;

      const result: RetentionRunResult = {
        messages: await this.deleteInBatches(this.expiredMessagesQuery()),
        emails: await this.deleteInBatches(this.expiredEmailsQuery()),
        webhooks: await this.deleteInBatches(this.expiredWebhooksQuery()),
        auditLogs: await this.deleteInBatches(this.expiredAuditLogsQuery()),
      };
      this.logger.info(result, 'Rotina de retenção de dados concluída.');
      return result;
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'Falha na rotina de retenção de dados.');
      throw error;
    } finally {
      if (acquired) await this.releaseLock();
      this.isRunning = false;
    }
  }

  private async tryAcquireLock(): Promise<boolean> {
    const rows: unknown = await this.dataSource.query('SELECT pg_try_advisory_lock($1) AS acquired', [
      ADVISORY_LOCK_KEY,
    ]);
    if (!Array.isArray(rows) || rows.length !== 1 || !this.isAdvisoryLockRow(rows[0])) return false;
    return rows[0].acquired === true;
  }

  private async releaseLock(): Promise<void> {
    await this.dataSource.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
  }

  private async deleteInBatches(query: string): Promise<number> {
    let deleted = 0;
    while (true) {
      const rows: unknown = await this.dataSource.query(query, [BATCH_SIZE, DEFAULT_DATA_RETENTION_DAYS]);
      if (!Array.isArray(rows)) return deleted;
      deleted += rows.length;
      if (rows.length < BATCH_SIZE) return deleted;
    }
  }

  private expiredMessagesQuery(): string {
    return `
      WITH expired AS (
        SELECT message.id
        FROM app.messages message
        INNER JOIN app.tenants tenant ON tenant.id = message.tenant_id
        WHERE message.created_at < CURRENT_TIMESTAMP - (tenant.data_retention_days * INTERVAL '1 day')
        ORDER BY message.created_at ASC
        LIMIT $1
      )
      DELETE FROM app.messages message USING expired
      WHERE message.id = expired.id
      RETURNING message.id
    `;
  }

  private expiredEmailsQuery(): string {
    return `
      WITH expired AS (
        SELECT email.id
        FROM app.email_messages email
        INNER JOIN app.tenants tenant ON tenant.id = email.tenant_id
        WHERE email.created_at < CURRENT_TIMESTAMP - (tenant.data_retention_days * INTERVAL '1 day')
        ORDER BY email.created_at ASC
        LIMIT $1
      )
      DELETE FROM app.email_messages email USING expired
      WHERE email.id = expired.id
      RETURNING email.id
    `;
  }

  private expiredWebhooksQuery(): string {
    return `
      WITH expired AS (
        SELECT webhook.id
        FROM events.webhook_events webhook
        LEFT JOIN app.tenants tenant ON tenant.id = webhook.tenant_id
        WHERE webhook.received_at < CURRENT_TIMESTAMP -
          (COALESCE(tenant.data_retention_days, $2) * INTERVAL '1 day')
        ORDER BY webhook.received_at ASC
        LIMIT $1
      )
      DELETE FROM events.webhook_events webhook USING expired
      WHERE webhook.id = expired.id
      RETURNING webhook.id
    `;
  }

  private expiredAuditLogsQuery(): string {
    return `
      WITH expired AS (
        SELECT audit.id
        FROM audit.audit_logs audit
        WHERE audit.occurred_at < CURRENT_TIMESTAMP - INTERVAL '6 months'
        ORDER BY audit.occurred_at ASC
        LIMIT $1
      )
      DELETE FROM audit.audit_logs audit USING expired
      WHERE audit.id = expired.id
      RETURNING audit.id
    `;
  }

  private isAdvisoryLockRow(value: unknown): value is AdvisoryLockRow {
    return typeof value === 'object' && value !== null && 'acquired' in value;
  }
}
