import { Writable } from 'stream';
import { Pool } from 'pg';
import { v7 as uuidv7 } from 'uuid';

const FLUSH_INTERVAL_MS = 2_000;
const MAX_BUFFER_SIZE = 500;
const COLUMNS_PER_ROW = 7;

const LEVEL_LABELS: Record<number, string> = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

/**
 * Contextos do próprio Nest que só emitem ruído de bootstrap (uma linha por
 * rota/controller registrado, repetido a cada reload em dev) e não têm valor
 * operacional para quem está investigando um problema.
 */
const NOISY_CONTEXTS = new Set(['RouterExplorer', 'RoutesResolver', 'InstanceLoader']);

interface BufferedRow {
  id: string;
  occurredAt: Date;
  level: string;
  context: string | null;
  message: string;
  requestId: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Duplica as linhas NDJSON escritas pelo Pino (que hoje só existem em stdout,
 * de forma efêmera) para a tabela `events.system_logs`, em lotes, sem nunca
 * lançar erro — uma falha de persistência de log técnico não pode derrubar o
 * pipeline de logging nem a aplicação. Descarta ruído de bootstrap do Nest e
 * requisições HTTP bem-sucedidas (sem valor diagnóstico); falhas de
 * requisição continuam sendo gravadas.
 */
export class SystemLogCaptureStream extends Writable {
  private buffer: BufferedRow[] = [];
  private readonly pool: Pool | null;
  private readonly flushTimer: NodeJS.Timeout;

  constructor(databaseUrl: string | undefined) {
    super();
    this.pool = databaseUrl ? new Pool({ connectionString: databaseUrl, max: 2 }) : null;
    this.flushTimer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    this.flushTimer.unref();
  }

  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      const lines = chunk.toString('utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        this.captureLine(line);
      }
      if (this.buffer.length >= MAX_BUFFER_SIZE) {
        void this.flush();
      }
    } catch {
      // Ver comentário da classe: captura é best-effort.
    }
    callback();
  }

  override _destroy(error: Error | null, callback: (error?: Error | null) => void): void {
    clearInterval(this.flushTimer);
    void this.flush().finally(() => {
      void this.pool?.end();
      callback(error);
    });
  }

  private captureLine(line: string): void {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return;
    }
    const { level, time, msg, context, reqId, ...metadata } = parsed;
    if (typeof context === 'string' && NOISY_CONTEXTS.has(context)) {
      return;
    }
    const res = metadata.res as { statusCode?: unknown } | undefined;
    const isSuccessfulHttpAccessLog =
      msg === 'request completed' && typeof res?.statusCode === 'number' && res.statusCode < 400;
    if (isSuccessfulHttpAccessLog) {
      return;
    }
    delete metadata.pid;
    delete metadata.hostname;
    const req = metadata.req as { id?: unknown } | undefined;
    const requestId =
      typeof reqId === 'string' ? reqId : typeof req?.id === 'string' ? req.id : null;
    this.buffer.push({
      id: uuidv7(),
      occurredAt: typeof time === 'number' ? new Date(time) : new Date(),
      level: LEVEL_LABELS[level as number] ?? 'info',
      context: typeof context === 'string' ? context : null,
      message: typeof msg === 'string' ? msg : '',
      requestId,
      metadata,
    });
  }

  private async flush(): Promise<void> {
    if (!this.pool || this.buffer.length === 0) return;
    const rows = this.buffer;
    this.buffer = [];
    const values: unknown[] = [];
    const placeholders = rows
      .map((row, index) => {
        const offset = index * COLUMNS_PER_ROW;
        values.push(
          row.id,
          row.occurredAt,
          row.level,
          row.context,
          row.message,
          row.requestId,
          JSON.stringify(row.metadata),
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}::jsonb)`;
      })
      .join(', ');
    try {
      await this.pool.query(
        `INSERT INTO events.system_logs (id, occurred_at, level, context, message, request_id, metadata) VALUES ${placeholders}`,
        values,
      );
    } catch {
      // Indisponibilidade do banco não pode afetar o pipeline de logging;
      // stdout continua sendo a fonte de verdade nesse cenário.
    }
  }
}
