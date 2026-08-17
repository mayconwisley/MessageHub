import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailSmtpConfiguration } from '@modules/email-configurations/domain/entities/email-smtp-configuration.entity';
import { IEmailSmtpConfigurationRepository } from '@modules/email-configurations/domain/repositories/email-smtp-configuration.repository.interface';
import { ConfigureEmailSmtpCommand } from '@modules/email-configurations/application/commands/configure-email-smtp.command';
import { ConfigureEmailSmtpHandler } from '@modules/email-configurations/application/handlers/configure-email-smtp.handler';

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

class FakeEmailSmtpConfigurationRepository implements IEmailSmtpConfigurationRepository {
  readonly saved: EmailSmtpConfiguration[] = [];
  readonly deleted: EmailSmtpConfiguration[] = [];
  constructor(private existing: EmailSmtpConfiguration | null = null) {}
  async save(configuration: EmailSmtpConfiguration): Promise<void> {
    this.saved.push(configuration);
    this.existing = configuration;
  }
  async findByTenantId(): Promise<EmailSmtpConfiguration | null> {
    return this.existing;
  }
  async delete(configuration: EmailSmtpConfiguration): Promise<void> {
    this.deleted.push(configuration);
  }
}

describe('ConfigureEmailSmtpHandler', () => {
  const tenantId = UniqueId.create();

  function buildCommand(overrides: Partial<Record<string, unknown>> = {}) {
    return new ConfigureEmailSmtpCommand(
      (overrides.tenantId as string) ?? tenantId.value,
      (overrides.host as string) ?? 'smtp.example.com',
      (overrides.port as number) ?? 587,
      (overrides.secure as boolean) ?? false,
      (overrides.username as string) ?? 'no-reply@example.com',
      (overrides.password as string) ?? 'super-secret',
      (overrides.fromEmail as string) ?? 'no-reply@example.com',
      (overrides.fromName as string) ?? 'Example Corp',
    );
  }

  it('creates a new SMTP configuration for a tenant that has none yet', async () => {
    const repository = new FakeEmailSmtpConfigurationRepository(null);
    const handler = new ConfigureEmailSmtpHandler(repository);

    const result = await handler.execute(buildCommand());

    const dto = expectOk(result);
    expect(dto.host).toBe('smtp.example.com');
    expect(dto.port).toBe(587);
    expect(dto.source).toBe('tenant');
    expect(repository.saved).toHaveLength(1);
  });

  it('updates the existing SMTP configuration when the tenant already has one', async () => {
    const existing = expectOk(
      EmailSmtpConfiguration.create({
        tenantId,
        host: 'smtp.old.com',
        port: 25,
        secure: false,
        username: 'old@example.com',
        password: 'old-secret',
        fromEmail: 'old@example.com',
        fromName: 'Old Corp',
      }),
    );
    const repository = new FakeEmailSmtpConfigurationRepository(existing);
    const handler = new ConfigureEmailSmtpHandler(repository);

    const result = await handler.execute(
      buildCommand({ host: 'smtp.new.com', port: 465, secure: true }),
    );

    const dto = expectOk(result);
    expect(dto.id).toBe(existing.id.value);
    expect(dto.host).toBe('smtp.new.com');
    expect(dto.port).toBe(465);
    expect(dto.secure).toBe(true);
    expect(repository.saved).toEqual([existing]);
  });

  it('returns a failure when the configuration is invalid', async () => {
    const repository = new FakeEmailSmtpConfigurationRepository(null);
    const handler = new ConfigureEmailSmtpHandler(repository);

    const result = await handler.execute(buildCommand({ host: '' }));

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_SMTP_CONFIGURATION');
    expect(repository.saved).toHaveLength(0);
  });

  it('returns a failure without persisting when updating with invalid data', async () => {
    const existing = expectOk(
      EmailSmtpConfiguration.create({
        tenantId,
        host: 'smtp.old.com',
        port: 25,
        secure: false,
        username: 'old@example.com',
        password: 'old-secret',
        fromEmail: 'old@example.com',
        fromName: 'Old Corp',
      }),
    );
    const repository = new FakeEmailSmtpConfigurationRepository(existing);
    const handler = new ConfigureEmailSmtpHandler(repository);

    const result = await handler.execute(buildCommand({ port: 999_999 }));

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('INVALID_SMTP_CONFIGURATION');
    expect(repository.saved).toHaveLength(0);
    expect(existing.port).toBe(25);
  });
});
