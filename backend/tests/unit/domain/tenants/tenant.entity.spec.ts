import { Result } from '@shared/result';
import { Tenant } from '@modules/tenants/domain/entities/tenant.entity';
import { TenantStatus } from '@modules/tenants/domain/enums/tenant-status.enum';
import { InvalidTenantNameError } from '@modules/tenants/domain/errors/invalid-tenant-name.error';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure)
    throw new Error(`esperava sucesso, obteve falha: ${JSON.stringify(result.error)}`);
  return result.value;
}

function createTenant(): Tenant {
  return expectOk(Tenant.create({ name: 'Acme Corp' }));
}

describe('Tenant', () => {
  it('cria um tenant ativo com o nome informado', () => {
    const tenant = createTenant();

    expect(tenant.name).toBe('Acme Corp');
    expect(tenant.status).toBe(TenantStatus.ACTIVE);
    expect(tenant.isActive()).toBe(true);
    expect(tenant.createdAt).toBeInstanceOf(Date);
  });

  it('falha ao criar com nome vazio', () => {
    const result = Tenant.create({ name: '   ' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidTenantNameError);
  });

  it('suspende e reativa o tenant', () => {
    const tenant = createTenant();

    tenant.suspend();
    expect(tenant.status).toBe(TenantStatus.SUSPENDED);
    expect(tenant.isActive()).toBe(false);

    tenant.activate();
    expect(tenant.status).toBe(TenantStatus.ACTIVE);
    expect(tenant.isActive()).toBe(true);
  });

  it('sincroniza nome a partir do canal padrão e reativa o tenant', () => {
    const tenant = createTenant();
    tenant.suspend();

    tenant.synchronizeFromDefaultChannel('  Novo Nome  ');

    expect(tenant.name).toBe('Novo Nome');
    expect(tenant.isActive()).toBe(true);
  });
});
