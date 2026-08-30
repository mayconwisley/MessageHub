import { GetOperationalSummaryHandler } from '@modules/monitoring/application/handlers/get-operational-summary.handler';
import {
  IMonitoringReadRepository,
  IntegrationMonitorDto,
  OperationalSummaryDto,
} from '@modules/monitoring/application/ports/monitoring-read.repository.interface';

class FakeMonitoringReadRepository implements IMonitoringReadRepository {
  async getIntegrationMonitor(): Promise<IntegrationMonitorDto | null> {
    return null;
  }

  async getOperationalSummary(): Promise<OperationalSummaryDto> {
    return {
      generatedAt: new Date('2026-08-30T00:00:00.000Z'),
      messages: { pending: 2, failedLast24Hours: 1 },
      emails: { pending: 3, failedLast24Hours: 0 },
      outbox: { pending: 4, failed: 1, oldestPendingAt: null },
    };
  }
}

describe('GetOperationalSummaryHandler', () => {
  it('retorna os indicadores operacionais sem expor payloads ou credenciais', async () => {
    const handler = new GetOperationalSummaryHandler(new FakeMonitoringReadRepository());

    await expect(handler.execute()).resolves.toMatchObject({
      messages: { pending: 2, failedLast24Hours: 1 },
      emails: { pending: 3, failedLast24Hours: 0 },
      outbox: { pending: 4, failed: 1 },
    });
  });
});
