import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '@modules/applications/domain/errors/application-not-found.error';
import {
  IMonitoringReadRepository,
  IntegrationMonitorDto,
  OperationalSummaryDto,
} from '@modules/monitoring/application/ports/monitoring-read.repository.interface';
import { GetIntegrationMonitorQuery } from '@modules/monitoring/application/queries/get-integration-monitor.query';
import { GetIntegrationMonitorHandler } from '@modules/monitoring/application/handlers/get-integration-monitor.handler';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure)
    throw new Error(`esperava sucesso, obteve falha: ${JSON.stringify(result.error)}`);
  return result.value;
}

class FakeMonitoringReadRepository implements IMonitoringReadRepository {
  private readonly byApplicationId = new Map<string, IntegrationMonitorDto>();

  seed(applicationId: string, dto: IntegrationMonitorDto): void {
    this.byApplicationId.set(applicationId, dto);
  }

  async getIntegrationMonitor(applicationId: string): Promise<IntegrationMonitorDto | null> {
    return this.byApplicationId.get(applicationId) ?? null;
  }

  async getOperationalSummary(): Promise<OperationalSummaryDto> {
    return {
      generatedAt: new Date(),
      messages: { pending: 0, failedLast24Hours: 0 },
      emails: { pending: 0, failedLast24Hours: 0 },
      outbox: { pending: 0, failed: 0, oldestPendingAt: null },
    };
  }
}

function buildMonitorDto(applicationId: string): IntegrationMonitorDto {
  return {
    application: {
      id: applicationId,
      name: 'Notifications',
      status: 'ACTIVE',
      quotaPerMinute: 60,
      quotaPerDay: 1000,
      usedLastMinute: 10,
      usedLastDay: 200,
      quotaStatus: 'HEALTHY',
    },
    apiKeys: [
      {
        id: 'key-1',
        prefix: 'mh_live_',
        status: 'ACTIVE',
        expiresAt: null,
        expiresInDays: null,
        lastUsedAt: null,
        health: 'HEALTHY',
      },
    ],
    phoneNumbers: [
      {
        id: 'phone-1',
        displayNumber: '+5511999999999',
        status: 'ACTIVE',
        whatsAppAccountId: 'account-1',
        accountStatus: 'ACTIVE',
        credentialSource: 'TENANT',
        credentialExpiresAt: null,
        credentialHealth: 'HEALTHY',
        health: 'HEALTHY',
      },
    ],
    delivery: { sentLast24Hours: 100, failedLast24Hours: 2, failureRate: 0.02 },
  };
}

describe('GetIntegrationMonitorHandler', () => {
  it('retorna falha de aplicação não encontrada quando não há monitor para o applicationId', async () => {
    const repository = new FakeMonitoringReadRepository();
    const handler = new GetIntegrationMonitorHandler(repository);

    const result = await handler.execute(new GetIntegrationMonitorQuery('unknown-app'));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ApplicationNotFoundError);
  });

  it('retorna o monitor mapeado quando a aplicação existe', async () => {
    const repository = new FakeMonitoringReadRepository();
    const dto = buildMonitorDto('app-1');
    repository.seed('app-1', dto);
    const handler = new GetIntegrationMonitorHandler(repository);

    const result = await handler.execute(new GetIntegrationMonitorQuery('app-1'));

    expect(expectOk(result)).toEqual(dto);
  });
});
