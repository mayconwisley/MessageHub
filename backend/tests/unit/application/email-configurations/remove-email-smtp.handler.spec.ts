import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailSmtpConfiguration } from '@modules/email-configurations/domain/entities/email-smtp-configuration.entity';
import { IEmailSmtpConfigurationRepository } from '@modules/email-configurations/domain/repositories/email-smtp-configuration.repository.interface';
import { RemoveEmailSmtpCommand } from '@modules/email-configurations/application/commands/remove-email-smtp.command';
import { RemoveEmailSmtpHandler } from '@modules/email-configurations/application/handlers/remove-email-smtp.handler';

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

class FakeEmailSmtpConfigurationRepository implements IEmailSmtpConfigurationRepository {
  readonly deleted: EmailSmtpConfiguration[] = [];
  constructor(private readonly existing: EmailSmtpConfiguration | null) {}
  async save(): Promise<void> {}
  async findByTenantId(): Promise<EmailSmtpConfiguration | null> {
    return this.existing;
  }
  async delete(configuration: EmailSmtpConfiguration): Promise<void> {
    this.deleted.push(configuration);
  }
}

describe('RemoveEmailSmtpHandler', () => {
  const tenantId = UniqueId.create();

  it('deletes the SMTP configuration when one exists for the tenant', async () => {
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
    const repository = new FakeEmailSmtpConfigurationRepository(configuration);
    const handler = new RemoveEmailSmtpHandler(repository);

    const result = await handler.execute(new RemoveEmailSmtpCommand(tenantId.value));

    expect(result.isSuccess).toBe(true);
    expect(repository.deleted).toEqual([configuration]);
  });

  it('succeeds as a no-op when the tenant has no configuration to remove', async () => {
    const repository = new FakeEmailSmtpConfigurationRepository(null);
    const handler = new RemoveEmailSmtpHandler(repository);

    const result = await handler.execute(new RemoveEmailSmtpCommand(tenantId.value));

    expect(result.isSuccess).toBe(true);
    expect(repository.deleted).toHaveLength(0);
  });
});
