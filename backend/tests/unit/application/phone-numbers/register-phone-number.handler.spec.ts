import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccountNotFoundError } from '@modules/whatsapp-accounts/domain/errors';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { InvalidPhoneNumberError } from '@modules/phone-numbers/domain/errors/invalid-phone-number.error';
import { IPhoneNumberRepository } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { RegisterPhoneNumberCommand } from '@modules/phone-numbers/application/commands/register-phone-number.command';
import { RegisterPhoneNumberHandler } from '@modules/phone-numbers/application/handlers/register-phone-number.handler';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure)
    throw new Error(`esperava sucesso, obteve falha: ${JSON.stringify(result.error)}`);
  return result.value;
}

class FakeWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(private readonly accounts: WhatsAppAccount[] = []) {}

  async save(): Promise<void> {}

  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    return this.accounts.find((account) => account.id.equals(id)) ?? null;
  }

  async findByTenantAndWabaId(): Promise<WhatsAppAccount | null> {
    return null;
  }

  async listByTenantId(): Promise<PaginatedResult<WhatsAppAccount>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }

  async findIdsByTenantId(): Promise<UniqueId[]> {
    return [];
  }
}

class FakePhoneNumberRepository implements IPhoneNumberRepository {
  readonly saved: PhoneNumber[] = [];

  async save(phoneNumber: PhoneNumber): Promise<void> {
    this.saved.push(phoneNumber);
  }

  async findById(): Promise<PhoneNumber | null> {
    return null;
  }

  async findByProviderPhoneNumberId(): Promise<PhoneNumber | null> {
    return null;
  }

  async listByWhatsAppAccountIds(): Promise<PaginatedResult<PhoneNumber>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

function createWhatsAppAccount(tenantId: UniqueId): WhatsAppAccount {
  return expectOk(WhatsAppAccount.create({ tenantId, wabaId: 'waba-1', accessToken: 'token-1' }));
}

describe('RegisterPhoneNumberHandler', () => {
  const tenantId = UniqueId.create();

  function buildHandler(options: { accounts?: WhatsAppAccount[] }) {
    const phoneNumbers = new FakePhoneNumberRepository();
    const accounts = new FakeWhatsAppAccountRepository(options.accounts ?? []);
    const handler = new RegisterPhoneNumberHandler(phoneNumbers, accounts);
    return { handler, phoneNumbers, accounts };
  }

  it('registra o número de telefone quando a conta do WhatsApp existe', async () => {
    const account = createWhatsAppAccount(tenantId);
    const { handler, phoneNumbers } = buildHandler({ accounts: [account] });

    const result = await handler.execute(
      new RegisterPhoneNumberCommand(account.id.value, 'meta-phone-1', '+5511999999999'),
    );

    const dto = expectOk(result);
    expect(dto).toEqual({
      id: phoneNumbers.saved[0].id.value,
      whatsAppAccountId: account.id.value,
      phoneNumberId: 'meta-phone-1',
      displayNumber: '+5511999999999',
      status: 'ACTIVE',
      createdAt: phoneNumbers.saved[0].createdAt,
    });
    expect(phoneNumbers.saved).toHaveLength(1);
  });

  it('falha quando a conta do WhatsApp não existe', async () => {
    const { handler } = buildHandler({});

    const result = await handler.execute(
      new RegisterPhoneNumberCommand(UniqueId.create().value, 'meta-phone-1', '+5511999999999'),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(WhatsAppAccountNotFoundError);
  });

  it('falha quando a conta do WhatsApp pertence a outro tenant', async () => {
    const account = createWhatsAppAccount(tenantId);
    const { handler } = buildHandler({ accounts: [account] });

    const result = await handler.execute(
      new RegisterPhoneNumberCommand(
        account.id.value,
        'meta-phone-1',
        '+5511999999999',
        UniqueId.create().value,
      ),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(WhatsAppAccountNotFoundError);
  });

  it('registra com sucesso quando o tenantId informado corresponde ao da conta', async () => {
    const account = createWhatsAppAccount(tenantId);
    const { handler, phoneNumbers } = buildHandler({ accounts: [account] });

    const result = await handler.execute(
      new RegisterPhoneNumberCommand(
        account.id.value,
        'meta-phone-1',
        '+5511999999999',
        tenantId.value,
      ),
    );

    expect(result.isFailure).toBe(false);
    expect(phoneNumbers.saved).toHaveLength(1);
  });

  it('falha quando os dados do número de telefone são inválidos', async () => {
    const account = createWhatsAppAccount(tenantId);
    const { handler, phoneNumbers } = buildHandler({ accounts: [account] });

    const result = await handler.execute(
      new RegisterPhoneNumberCommand(account.id.value, '   ', '+5511999999999'),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidPhoneNumberError);
    expect(phoneNumbers.saved).toHaveLength(0);
  });
});
