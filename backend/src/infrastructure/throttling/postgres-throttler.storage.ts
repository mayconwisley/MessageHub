import type { ThrottlerStorage } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

interface ThrottlerEntryRow {
  hits: number;
  expiresAt: Date;
  blockedUntil: Date | null;
}

/**
 * Implementação compartilhada do rate limit. Mantém o contador no PostgreSQL
 * para que todas as réplicas da API apliquem a mesma janela de proteção.
 */
export class PostgresThrottlerStorage implements ThrottlerStorage {
  private lastExpiredEntryCleanupAt = 0;

  constructor(private readonly dataSource: DataSource) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    await this.removeExpiredEntriesIfDue();
    const [entry] = await this.dataSource.query<ThrottlerEntryRow[]>(
      `INSERT INTO events.throttler_entries (
          throttler_key, throttler_name, hits, expires_at, blocked_until
        ) VALUES ($1, $2, 1, now() + ($3 * interval '1 millisecond'), NULL)
        ON CONFLICT (throttler_key, throttler_name) DO UPDATE
        SET hits = CASE
              WHEN events.throttler_entries.expires_at <= now() THEN 1
              ELSE events.throttler_entries.hits + 1
            END,
            expires_at = CASE
              WHEN events.throttler_entries.expires_at <= now()
                THEN now() + ($3 * interval '1 millisecond')
              ELSE events.throttler_entries.expires_at
            END,
            blocked_until = CASE
              WHEN events.throttler_entries.expires_at <= now() THEN NULL
              ELSE events.throttler_entries.blocked_until
            END
        RETURNING hits, expires_at AS "expiresAt", blocked_until AS "blockedUntil"`,
      [key, throttlerName, ttl],
    );

    const now = Date.now();
    const currentBlockedUntil = entry.blockedUntil?.getTime() ?? 0;
    const shouldBlock = currentBlockedUntil <= now && entry.hits > limit;
    const effectiveBlockedUntil = shouldBlock
      ? await this.block(key, throttlerName, blockDuration || ttl)
      : currentBlockedUntil;

    return {
      totalHits: entry.hits,
      timeToExpire: Math.max(0, entry.expiresAt.getTime() - now),
      isBlocked: effectiveBlockedUntil > now,
      timeToBlockExpire: Math.max(0, effectiveBlockedUntil - now),
    };
  }

  private async block(key: string, throttlerName: string, blockDuration: number): Promise<number> {
    const [entry] = await this.dataSource.query<Array<{ blockedUntil: Date }>>(
      `UPDATE events.throttler_entries
       SET blocked_until = now() + ($3 * interval '1 millisecond')
       WHERE throttler_key = $1 AND throttler_name = $2
       RETURNING blocked_until AS "blockedUntil"`,
      [key, throttlerName, blockDuration],
    );
    return entry.blockedUntil.getTime();
  }

  private async removeExpiredEntriesIfDue(): Promise<void> {
    const now = Date.now();
    const cleanupIntervalMs = 60_000;
    if (now - this.lastExpiredEntryCleanupAt < cleanupIntervalMs) return;

    this.lastExpiredEntryCleanupAt = now;
    await this.dataSource.query(
      `DELETE FROM events.throttler_entries
       WHERE expires_at <= now() AND (blocked_until IS NULL OR blocked_until <= now())`,
    );
  }
}
