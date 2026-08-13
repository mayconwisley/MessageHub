import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Tenant } from '@modules/tenants/domain/entities/tenant.entity';
import { TenantStatus } from '@modules/tenants/domain/enums/tenant-status.enum';
import { TenantNotFoundError } from '@modules/tenants/domain/errors/tenant-not-found.error';
import { ITenantRepository } from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { UpdateTenantStatusHandler } from '@modules/tenants/application/handlers/update-tenant-status.handler';
import { UpdateTenantStatusCommand } from '@modules/tenants/application/commands/update-tenant-status.command';

class FakeTenantRepository implements ITenantRepository {
  private readonly byId = new Map<string, Tenant>();
  readonly saved: Tenant[] = [];

  seed(tenant: Tenant): void {
    this.byId.set(tenant.id.value, tenant);
  }

  async save(tenant: Tenant): Promise<void> {
    this.saved.push(tenant);
    this.byId.set(tenant.id.value, tenant);
  }

  async findById(id: UniqueId): Promise<Tenant | null> {
    return this.byId.get(id.value) ?? null;
  }

  async list(): Promise<PaginatedResult<Tenant>> {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
}

describe('UpdateTenantStatusHandler', () => {
  let repository: FakeTenantRepository;
  let handler: UpdateTenantStatusHandler;

  beforeEach(() => {
    repository = new FakeTenantRepository();
    handler = new UpdateTenantStatusHandler(repository);
  });

  it('suspende o tenant e persiste a alteração', async () => {
    const id = UniqueId.create();
    const tenant = Tenant.reconstitute(
      { name: 'Acme', status: TenantStatus.ACTIVE, createdAt: new Date() },
      id,
    );
    repository.seed(tenant);

    const result = await handler.execute(
      new UpdateTenantStatusCommand(id.value, TenantStatus.SUSPENDED),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe(TenantStatus.SUSPENDED);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0].status).toBe(TenantStatus.SUSPENDED);
  });

  it('reativa o tenant e persiste a alteração', async () => {
    const id = UniqueId.create();
    const tenant = Tenant.reconstitute(
      { name: 'Acme', status: TenantStatus.SUSPENDED, createdAt: new Date() },
      id,
    );
    repository.seed(tenant);

    const result = await handler.execute(
      new UpdateTenantStatusCommand(id.value, TenantStatus.ACTIVE),
    );

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe(TenantStatus.ACTIVE);
    expect(repository.saved[0].status).toBe(TenantStatus.ACTIVE);
  });

  it('retorna TenantNotFoundError quando o tenant não existe', async () => {
    const result = await handler.execute(
      new UpdateTenantStatusCommand(UniqueId.create().value, TenantStatus.SUSPENDED),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(TenantNotFoundError);
    expect(repository.saved).toHaveLength(0);
  });
});
