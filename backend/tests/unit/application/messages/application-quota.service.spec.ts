import { ApplicationQuotaService } from '@modules/messages/application/services/application-quota.service';
import { Application } from '@modules/applications/domain/entities/application.entity';
import { UniqueId } from '@shared/domain';

describe('ApplicationQuotaService', () => {
  const application = Application.create({ tenantId: UniqueId.create(), name: 'integração' }).value;
  it('aceita uso abaixo dos limites', async () => {
    const service = new ApplicationQuotaService({
      countCreatedSince: jest.fn().mockResolvedValue(0),
    } as never);
    await expect(service.assertCanAcceptMessage(application)).resolves.toBeUndefined();
  });
  it('rejeita quando a quota por minuto foi esgotada', async () => {
    const service = new ApplicationQuotaService({
      countCreatedSince: jest
        .fn()
        .mockResolvedValueOnce(application.quotaPerMinute)
        .mockResolvedValueOnce(0),
    } as never);
    await expect(service.assertCanAcceptMessage(application)).rejects.toMatchObject({
      code: 'RATE_LIMIT_EXCEEDED',
    });
  });
});
