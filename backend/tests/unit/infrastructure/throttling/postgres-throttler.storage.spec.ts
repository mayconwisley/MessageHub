import { DataSource } from 'typeorm';
import { PostgresThrottlerStorage } from '@infrastructure/throttling/postgres-throttler.storage';

describe('PostgresThrottlerStorage', () => {
  it('persiste o bloqueio compartilhado ao ultrapassar o limite', async () => {
    const now = Date.now();
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          hits: 3,
          expiresAt: new Date(now + 60_000),
          blockedUntil: null,
        },
      ])
      .mockResolvedValueOnce([{ blockedUntil: new Date(now + 30_000) }]);
    const storage = new PostgresThrottlerStorage({ query } as unknown as DataSource);

    const result = await storage.increment('tenant:application', 60_000, 2, 30_000, 'default');

    expect(result.totalHits).toBe(3);
    expect(result.isBlocked).toBe(true);
    expect(result.timeToExpire).toBeGreaterThan(0);
    expect(result.timeToBlockExpire).toBeGreaterThan(0);
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO events.throttler_entries'),
      ['tenant:application', 'default', 60_000],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE events.throttler_entries'),
      ['tenant:application', 'default', 30_000],
    );
  });

  it('respeita um bloqueio já existente sem gravá-lo novamente', async () => {
    const now = Date.now();
    const query = jest
      .fn<Promise<unknown>, [string, unknown[]?]>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          hits: 4,
          expiresAt: new Date(now + 60_000),
          blockedUntil: new Date(now + 20_000),
        },
      ]);
    const storage = new PostgresThrottlerStorage({ query } as unknown as DataSource);

    const result = await storage.increment('tenant:application', 60_000, 2, 30_000, 'default');

    expect(result.isBlocked).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);
  });
});
