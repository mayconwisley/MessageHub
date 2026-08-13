import {
  DashboardDeliveryStatusDto,
  DashboardMessageVolumePointDto,
  DashboardOperationalHealthDto,
  DashboardRecentMessageDto,
  DashboardResourceSummaryDto,
  IDashboardReadRepository,
} from '@modules/dashboard/application/ports/dashboard-read.repository.interface';
import { GetResourceSummaryHandler } from '@modules/dashboard/application/handlers/get-resource-summary.handler';
import { GetResourceSummaryQuery } from '@modules/dashboard/application/queries/get-resource-summary.query';

class FakeDashboardReadRepository implements IDashboardReadRepository {
  readonly receivedTenantIds: (string | undefined)[] = [];
  global: DashboardResourceSummaryDto = {
    tenants: 10,
    applications: 20,
    whatsAppAccounts: 5,
    phoneNumbers: 8,
  };
  byTenant = new Map<string, DashboardResourceSummaryDto>();

  async getResourceSummary(tenantId?: string): Promise<DashboardResourceSummaryDto> {
    this.receivedTenantIds.push(tenantId);
    if (tenantId)
      return (
        this.byTenant.get(tenantId) ?? {
          tenants: 0,
          applications: 0,
          whatsAppAccounts: 0,
          phoneNumbers: 0,
        }
      );
    return this.global;
  }

  async getMessageVolume(): Promise<DashboardMessageVolumePointDto[]> {
    return [];
  }

  async getDeliveryStatus(): Promise<DashboardDeliveryStatusDto> {
    return { total: 0, items: [] };
  }

  async getOperationalHealth(): Promise<DashboardOperationalHealthDto> {
    return { pendingMessages: 0, failedLast24Hours: 0, activePhoneNumbers: 0, successRate: 0 };
  }

  async getRecentMessages(): Promise<DashboardRecentMessageDto[]> {
    return [];
  }
}

describe('GetResourceSummaryHandler', () => {
  let repository: FakeDashboardReadRepository;
  let handler: GetResourceSummaryHandler;

  beforeEach(() => {
    repository = new FakeDashboardReadRepository();
    handler = new GetResourceSummaryHandler(repository);
  });

  it('retorna o resumo global quando não há escopo de tenant (admin da plataforma)', async () => {
    const result = await handler.execute(new GetResourceSummaryQuery());

    expect(result).toEqual(repository.global);
    expect(repository.receivedTenantIds).toEqual([undefined]);
  });

  it('repassa o tenantId informado e retorna o resumo escopado a esse tenant', async () => {
    repository.byTenant.set('tenant-1', {
      tenants: 1,
      applications: 3,
      whatsAppAccounts: 1,
      phoneNumbers: 2,
    });

    const result = await handler.execute(new GetResourceSummaryQuery('tenant-1'));

    expect(result).toEqual({ tenants: 1, applications: 3, whatsAppAccounts: 1, phoneNumbers: 2 });
    expect(repository.receivedTenantIds).toEqual(['tenant-1']);
  });

  it('não mistura o resumo de um tenant com o de outro', async () => {
    repository.byTenant.set('tenant-1', {
      tenants: 1,
      applications: 3,
      whatsAppAccounts: 1,
      phoneNumbers: 2,
    });
    repository.byTenant.set('tenant-2', {
      tenants: 1,
      applications: 9,
      whatsAppAccounts: 4,
      phoneNumbers: 7,
    });

    const result = await handler.execute(new GetResourceSummaryQuery('tenant-2'));

    expect(result).toEqual({ tenants: 1, applications: 9, whatsAppAccounts: 4, phoneNumbers: 7 });
  });
});
