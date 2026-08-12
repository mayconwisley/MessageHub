import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { Application } from '@modules/applications/domain/entities/application.entity';
import { IApplicationRepository } from '@modules/applications/domain/repositories/application.repository.interface';
import { IApplicationPhoneNumberLinkRepository } from '@modules/applications/domain/repositories/application-phone-number-link.repository.interface';
import { SetApplicationPhoneNumbersCommand } from '@modules/applications/application/commands/set-application-phone-numbers.command';
import { SetApplicationPhoneNumbersHandler } from '@modules/applications/application/handlers/set-application-phone-numbers.handler';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';

class FakeApplicationRepository implements IApplicationRepository {
  constructor(private readonly applications: Application[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<Application | null> {
    return this.applications.find((application) => application.id.equals(id)) ?? null;
  }
  async listByTenantId(): Promise<import('@shared/types').PaginatedResult<Application>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakePhoneNumberRepository implements IPhoneNumberRepository {
  constructor(private readonly phoneNumbers: PhoneNumber[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<PhoneNumber | null> {
    return this.phoneNumbers.find((phoneNumber) => phoneNumber.id.equals(id)) ?? null;
  }
  async findByProviderPhoneNumberId(): Promise<PhoneNumber | null> {
    return null;
  }
  async listByWhatsAppAccountIds(): Promise<import('@shared/types').PaginatedResult<PhoneNumber>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(private readonly accounts: WhatsAppAccount[]) {}
  async save(): Promise<void> {}
  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    return this.accounts.find((account) => account.id.equals(id)) ?? null;
  }
  async findByTenantAndWabaId(): Promise<WhatsAppAccount | null> {
    return null;
  }
  async listByTenantId(): Promise<import('@shared/types').PaginatedResult<WhatsAppAccount>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
  async findIdsByTenantId(): Promise<UniqueId[]> {
    return [];
  }
}

class FakeApplicationPhoneNumberLinkRepository implements IApplicationPhoneNumberLinkRepository {
  readonly linked = new Map<string, UniqueId[]>();
  async replaceForApplication(applicationId: UniqueId, phoneNumberIds: UniqueId[]): Promise<void> {
    this.linked.set(applicationId.value, phoneNumberIds);
  }
  async listPhoneNumberIdsByApplication(applicationId: UniqueId): Promise<UniqueId[]> {
    return this.linked.get(applicationId.value) ?? [];
  }
  async listApplicationIdsByPhoneNumber(): Promise<UniqueId[]> {
    return [];
  }
}

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

describe('SetApplicationPhoneNumbersHandler', () => {
  const tenantId = UniqueId.create();
  const otherTenantId = UniqueId.create();

  function buildHandler(options: {
    applications?: Application[];
    phoneNumbers?: PhoneNumber[];
    accounts?: WhatsAppAccount[];
  }) {
    const links = new FakeApplicationPhoneNumberLinkRepository();
    const handler = new SetApplicationPhoneNumbersHandler(
      new FakeApplicationRepository(options.applications ?? []),
      new FakePhoneNumberRepository(options.phoneNumbers ?? []),
      new FakeWhatsAppAccountRepository(options.accounts ?? []),
      links,
    );
    return { handler, links };
  }

  it('links the phone numbers when they belong to the same tenant as the application', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
    const whatsAppAccount = expectOk(
      WhatsAppAccount.create({ tenantId, wabaId: 'waba-1', accessToken: 'token-1' }),
    );
    const phoneNumber = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: whatsAppAccount.id,
        phoneNumberId: 'meta-phone-1',
        displayNumber: '+5511999999999',
      }),
    );
    const { handler, links } = buildHandler({
      applications: [application],
      phoneNumbers: [phoneNumber],
      accounts: [whatsAppAccount],
    });

    const result = await handler.execute(
      new SetApplicationPhoneNumbersCommand(application.id.value, [phoneNumber.id.value]),
    );

    const dto = expectOk(result);
    expect(dto).toEqual([
      {
        id: phoneNumber.id.value,
        phoneNumberId: phoneNumber.phoneNumberId,
        displayNumber: phoneNumber.displayNumber,
      },
    ]);
    expect(links.linked.get(application.id.value)?.map((id) => id.value)).toEqual([
      phoneNumber.id.value,
    ]);
  });

  it('fails when the application does not exist', async () => {
    const { handler } = buildHandler({});

    const result = await handler.execute(
      new SetApplicationPhoneNumbersCommand(UniqueId.create().value, []),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('APPLICATION_NOT_FOUND');
  });

  it('fails when a phone number does not exist', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
    const { handler } = buildHandler({ applications: [application] });

    const result = await handler.execute(
      new SetApplicationPhoneNumbersCommand(application.id.value, [UniqueId.create().value]),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('PHONE_NUMBER_NOT_FOUND');
  });

  it('fails when the phone number belongs to a different tenant', async () => {
    const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));
    const foreignAccount = expectOk(
      WhatsAppAccount.create({ tenantId: otherTenantId, wabaId: 'waba-2', accessToken: 'token-2' }),
    );
    const foreignPhoneNumber = expectOk(
      PhoneNumber.create({
        whatsAppAccountId: foreignAccount.id,
        phoneNumberId: 'meta-phone-2',
        displayNumber: '+5511977777777',
      }),
    );
    const { handler } = buildHandler({
      applications: [application],
      phoneNumbers: [foreignPhoneNumber],
      accounts: [foreignAccount],
    });

    const result = await handler.execute(
      new SetApplicationPhoneNumbersCommand(application.id.value, [foreignPhoneNumber.id.value]),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('PHONE_NUMBER_TENANT_MISMATCH');
  });
});
