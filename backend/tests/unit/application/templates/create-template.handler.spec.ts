import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaProviderError } from '@modules/messages/domain/errors/meta-provider-error.type';
import { Template } from '@modules/templates/domain/entities/template.entity';
import { TemplateStatus } from '@modules/templates/domain/enums/template-status.enum';
import { TemplateAlreadyExistsError } from '@modules/templates/domain/errors/template-already-exists.error';
import { ITemplateRepository } from '@modules/templates/domain/repositories/template.repository.interface';
import {
  ITemplateProvider,
  TemplateDefinition,
  TemplateSummary,
} from '@modules/templates/application/ports/template-provider.interface';
import { TemplateAccountResolverService } from '@modules/templates/application/services/template-account-resolver.service';
import { CreateTemplateCommand } from '@modules/templates/application/commands/create-template.command';
import { CreateTemplateHandler } from '@modules/templates/application/handlers/create-template.handler';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure) throw new Error(`esperava sucesso: ${JSON.stringify(result.error)}`);
  return result.value;
}

class FakeWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  private readonly byId = new Map<string, WhatsAppAccount>();

  seed(account: WhatsAppAccount): void {
    this.byId.set(account.id.value, account);
  }

  async save(whatsAppAccount: WhatsAppAccount): Promise<void> {
    this.byId.set(whatsAppAccount.id.value, whatsAppAccount);
  }

  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    return this.byId.get(id.value) ?? null;
  }

  async findByTenantAndWabaId(): Promise<WhatsAppAccount | null> {
    return null;
  }

  async listByTenantId(): Promise<PaginatedResult<WhatsAppAccount>> {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }

  async findIdsByTenantId(): Promise<UniqueId[]> {
    return [];
  }
}

class FakeTemplateRepository implements ITemplateRepository {
  readonly saved: Template[] = [];
  private readonly byId = new Map<string, Template>();
  duplicate: Template | null = null;

  async save(template: Template): Promise<void> {
    this.saved.push(template);
    this.byId.set(template.id.value, template);
  }

  async remove(template: Template): Promise<void> {
    this.byId.delete(template.id.value);
  }

  async findById(tenantId: UniqueId, id: UniqueId): Promise<Template | null> {
    const template = this.byId.get(id.value) ?? null;
    return template && template.tenantId.value === tenantId.value ? template : null;
  }

  async findByMetaId(): Promise<Template | null> {
    return null;
  }

  async findByNameAndLanguage(): Promise<Template | null> {
    return this.duplicate;
  }

  async findByName(): Promise<Template[]> {
    return [];
  }

  async list(): Promise<Template[]> {
    return [];
  }

  async listPaginated(): Promise<PaginatedResult<Template>> {
    return { items: [], total: 0, page: 1, pageSize: 10 };
  }
}

class FakeTemplateProvider implements ITemplateProvider {
  createResult: Result<TemplateSummary, MetaProviderError> = Result.ok({
    id: 'meta-template-1',
    status: 'APPROVED',
    name: '',
    language: '',
    category: '',
    components: [],
  });

  async create(): Promise<Result<TemplateSummary, MetaProviderError>> {
    return this.createResult;
  }

  async list(): Promise<Result<TemplateSummary[], MetaProviderError>> {
    return Result.ok([]);
  }

  async update(): Promise<Result<void, MetaProviderError>> {
    return Result.ok(undefined);
  }

  async delete(): Promise<Result<void, MetaProviderError>> {
    return Result.ok(undefined);
  }
}

function createAccount(tenantId: string): WhatsAppAccount {
  return expectOk(
    WhatsAppAccount.create({
      tenantId: UniqueId.create(tenantId),
      wabaId: 'waba-1',
      credentialSource: WhatsAppCredentialSource.TENANT,
      accessToken: 'token',
    }),
  );
}

function createDefinition(overrides: Partial<TemplateDefinition> = {}): TemplateDefinition {
  return {
    name: 'boas_vindas',
    language: 'pt_BR',
    category: 'MARKETING',
    components: [{ type: 'BODY', text: 'Olá, bem-vindo!' }],
    ...overrides,
  };
}

describe('CreateTemplateHandler', () => {
  let accounts: FakeWhatsAppAccountRepository;
  let templates: FakeTemplateRepository;
  let provider: FakeTemplateProvider;
  let handler: CreateTemplateHandler;
  const tenantId = UniqueId.create().value;

  beforeEach(() => {
    accounts = new FakeWhatsAppAccountRepository();
    templates = new FakeTemplateRepository();
    provider = new FakeTemplateProvider();
    handler = new CreateTemplateHandler(
      templates,
      provider,
      new TemplateAccountResolverService(accounts),
    );
  });

  it('cria e publica um template com sucesso', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    provider.createResult = Result.ok({
      id: 'meta-template-1',
      status: 'approved',
      name: 'boas_vindas',
      language: 'pt_BR',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Olá, bem-vindo!' }],
    });

    const result = await handler.execute(
      new CreateTemplateCommand(tenantId, account.id.value, createDefinition()),
    );

    const dto = expectOk(result);
    expect(dto.id).toBe('meta-template-1');
    expect(dto.status).toBe(TemplateStatus.APPROVED);
    expect(templates.saved).toHaveLength(2);
    expect(templates.saved[1].metaTemplateId).toBe('meta-template-1');
  });

  it('falha ao criar quando já existe um template publicado com mesmo nome e idioma', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    const existing = Template.create({
      tenantId: UniqueId.create(tenantId),
      whatsAppAccountId: account.id,
      name: 'boas_vindas',
      language: 'pt_BR',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Olá!' }],
      parameterFormat: null,
    });
    existing.applyPublished('meta-existing', 'APPROVED');
    templates.duplicate = existing;

    const result = await handler.execute(
      new CreateTemplateCommand(tenantId, account.id.value, createDefinition()),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(TemplateAlreadyExistsError);
    expect(templates.saved).toHaveLength(0);
  });

  it('registra a falha de publicação quando o provedor rejeita o template', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    const providerError = new ProviderUnavailableError('Meta indisponível');
    provider.createResult = Result.fail(providerError);

    const result = await handler.execute(
      new CreateTemplateCommand(tenantId, account.id.value, createDefinition()),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(providerError);
    expect(templates.saved).toHaveLength(2);
    expect(templates.saved[1].lastError).toBe('Meta indisponível');
    expect(templates.saved[1].metaTemplateId).toBeNull();
  });

  it('falha quando a conta do WhatsApp não pertence ao tenant informado', async () => {
    const account = createAccount('outro-tenant');
    accounts.seed(account);

    const result = await handler.execute(
      new CreateTemplateCommand(tenantId, account.id.value, createDefinition()),
    );

    expect(result.isFailure).toBe(true);
    expect(templates.saved).toHaveLength(0);
  });
});
