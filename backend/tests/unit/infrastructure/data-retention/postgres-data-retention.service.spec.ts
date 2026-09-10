import { PinoLogger } from 'nestjs-pino';
import { DataSource, QueryRunner } from 'typeorm';
import { PostgresDataRetentionService } from '@modules/data-retention/infrastructure/services/postgres-data-retention.service';

describe('PostgresDataRetentionService', () => {
  it('envia somente os parâmetros usados por cada consulta na mesma conexão do advisory lock', async () => {
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([{ acquired: true }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const connect = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
    const release = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
    const queryRunner = { query, connect, release } as unknown as QueryRunner;
    const createQueryRunner = jest.fn<QueryRunner, []>().mockReturnValue(queryRunner);
    const dataSource = { createQueryRunner } as unknown as DataSource;
    const logger = {
      setContext: jest.fn<void, [string]>(),
      info: jest.fn<void, [unknown, string]>(),
      error: jest.fn<void, [unknown, string]>(),
    } as unknown as PinoLogger;
    const service = new PostgresDataRetentionService(dataSource, logger);

    const result = await service.run();

    expect(result).toEqual({ messages: 0, emails: 0, webhooks: 0, auditLogs: 0 });
    expect(createQueryRunner).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [8_135_402],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('DELETE FROM app.messages'),
      [1_000],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('DELETE FROM app.email_messages'),
      [1_000],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('DELETE FROM events.webhook_events'),
      [1_000, 90],
    );
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('DELETE FROM audit.audit_logs'),
      [1_000],
    );
    expect(query).toHaveBeenNthCalledWith(6, 'SELECT pg_advisory_unlock($1)', [8_135_402]);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
