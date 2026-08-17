import { SmtpConfigService } from '@infrastructure/configuration/smtp-config.service';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { SmtpConnectionSettings } from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { EmailSmtpConfiguration } from '@modules/email-configurations/domain/entities/email-smtp-configuration.entity';
import { IEmailSmtpConfigurationRepository } from '@modules/email-configurations/domain/repositories/email-smtp-configuration.repository.interface';
import { GetEmailSmtpConfigurationHandler } from '@modules/email-configurations/application/handlers/get-email-smtp-configuration.handler';
import { GetEmailSmtpConfigurationQuery } from '@modules/email-configurations/application/queries/get-email-smtp-configuration.query';

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

class FakeEmailSmtpConfigurationRepository implements IEmailSmtpConfigurationRepository {
  constructor(private readonly existing: EmailSmtpConfiguration | null) {}
  async save(): Promise<void> {}
  async findByTenantId(): Promise<EmailSmtpConfiguration | null> {
    return this.existing;
  }
  async delete(): Promise<void> {}
}

function buildDefaultSmtpService(
  defaultSettings: SmtpConnectionSettings | null,
): SmtpConfigService {
  return { defaultSettings } as unknown as SmtpConfigService;
}

describe('GetEmailSmtpConfigurationHandler', () => {
  const tenantId = UniqueId.create();

  it('returns the tenant configuration when one is persisted', async () => {
    const configuration = expectOk(
      EmailSmtpConfiguration.create({
        tenantId,
        host: 'smtp.tenant.com',
        port: 587,
        secure: false,
        username: 'tenant@example.com',
        password: 'tenant-secret',
        fromEmail: 'tenant@example.com',
        fromName: 'Tenant Corp',
      }),
    );
    const handler = new GetEmailSmtpConfigurationHandler(
      new FakeEmailSmtpConfigurationRepository(configuration),
      buildDefaultSmtpService(null),
    );

    const result = await handler.execute(new GetEmailSmtpConfigurationQuery(tenantId.value));

    const dto = expectOk(result);
    expect(dto.source).toBe('tenant');
    expect(dto.host).toBe('smtp.tenant.com');
    expect(dto.id).toBe(configuration.id.value);
  });

  it('falls back to the default SMTP settings when the tenant has none configured', async () => {
    const handler = new GetEmailSmtpConfigurationHandler(
      new FakeEmailSmtpConfigurationRepository(null),
      buildDefaultSmtpService({
        host: 'smtp.default.com',
        port: 587,
        secure: false,
        username: 'default@example.com',
        password: 'default-secret',
        fromEmail: 'default@example.com',
        fromName: 'Default Corp',
      }),
    );

    const result = await handler.execute(new GetEmailSmtpConfigurationQuery(tenantId.value));

    const dto = expectOk(result);
    expect(dto.source).toBe('default');
    expect(dto.id).toBeNull();
    expect(dto.fromEmail).toBe('default@example.com');
    expect(dto.fromName).toBe('Default Corp');
    expect(dto.host).toBeNull();
  });

  it('reports source "none" when neither a tenant configuration nor a default exists', async () => {
    const handler = new GetEmailSmtpConfigurationHandler(
      new FakeEmailSmtpConfigurationRepository(null),
      buildDefaultSmtpService(null),
    );

    const result = await handler.execute(new GetEmailSmtpConfigurationQuery(tenantId.value));

    const dto = expectOk(result);
    expect(dto.source).toBe('none');
    expect(dto.id).toBeNull();
    expect(dto.fromEmail).toBeNull();
  });
});
