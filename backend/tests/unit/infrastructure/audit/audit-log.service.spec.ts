import { Repository } from 'typeorm';
import { AuditLogService } from '@modules/audit/infrastructure/services/audit-log.service';
import { AuditLogOrmEntity } from '@modules/audit/infrastructure/entities/audit-log.orm-entity';

describe('AuditLogService', () => {
  it('registra o log com id gerado, occurredAt atual e os campos informados', async () => {
    const save = jest.fn<Promise<AuditLogOrmEntity>, [AuditLogOrmEntity]>();
    const repository = { save } as unknown as Repository<AuditLogOrmEntity>;
    const service = new AuditLogService(repository);

    const entry: Omit<AuditLogOrmEntity, 'id' | 'occurredAt'> = {
      actorUserId: 'user-1',
      actorEmail: 'ana@hub.com',
      action: 'TENANT_SUSPENDED',
      resourceType: 'tenant',
      resourceId: 'tenant-1',
      tenantId: 'tenant-1',
      requestId: 'req-1',
      httpMethod: 'PATCH',
      httpPath: '/tenants/tenant-1/status',
      httpStatus: 200,
      metadata: { reason: 'billing' },
    };

    const before = new Date();
    await service.record(entry);
    const after = new Date();

    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0];

    expect(typeof saved.id).toBe('string');
    expect(saved.id.length).toBeGreaterThan(0);
    expect(saved.occurredAt).toBeInstanceOf(Date);
    expect(saved.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(saved.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());

    expect(saved).toMatchObject(entry);
  });
});
