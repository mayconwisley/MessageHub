import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { IWhatsAppAccountRepository } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { MetaProviderError } from '@modules/messages/domain/errors/meta-provider-error.type';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { Template } from '@modules/templates/domain/entities/template.entity';
import { MetaTemplateIdRequiredError } from '@modules/templates/domain/errors/meta-template-id-required.error';
import { TemplateNotFoundError } from '@modules/templates/domain/errors/template-not-found.error';
import { ITemplateRepository } from '@modules/templates/domain/repositories/template.repository.interface';
import {
  ITemplateProvider,
  TemplateSummary,
} from '@modules/templates/application/ports/template-provider.interface';
import { TemplateAccountResolverService } from '@modules/templates/application/services/template-account-resolver.service';
import { DeleteTemplateCommand } from '@modules/templates/application/commands/delete-template.command';
import { DeleteTemplateHandler } from '@modules/templates/application/handlers/delete-template.handler';

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
  readonly removed: Template[] = [];
  private readonly byId = new Map<string, Template>();

  seed(tenantId: string, template: Template): void {
    this.byId.set(`${tenantId}:${template.id.value}`, template);
  }

  async save(): Promise<void> {}

  async remove(template: Template): Promise<void> {
    this.removed.push(template);
    this.byId.delete(`${template.tenantId.value}:${template.id.value}`);
  }

  async findById(tenantId: UniqueId, id: UniqueId): Promise<Template | null> {
    return this.byId.get(`${tenantId.value}:${id.value}`) ?? null;
  }

  async findByMetaId(): Promise<Template | null> {
    return null;
  }

  async findByNameAndLanguage(): Promise<Template | null> {
    return null;
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
  deleteResult: Result<void, MetaProviderError> = Result.ok(undefined);

  async create(): Promise<Result<TemplateSummary, MetaProviderError>> {
    return Result.ok({ id: '', status: '', name: '', language: '', category: '', components: [] });
  }

  async list(): Promise<Result<TemplateSummary[], MetaProviderError>> {
    return Result.ok([]);
  }

  async update(): Promise<Result<void, MetaProviderError>> {
    return Result.ok(undefined);
  }

  async delete(): Promise<Result<void, MetaProviderError>> {
    return this.deleteResult;
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

function createPublishedTemplate(tenantId: string, whatsAppAccountId: UniqueId): Template {
  const template = Template.create({
    tenantId: UniqueId.create(tenantId),
    whatsAppAccountId,
    name: 'boas_vindas',
    language: 'pt_BR',
    category: 'MARKETING',
    components: [{ type: 'BODY', text: 'Olá!' }],
    parameterFormat: null,
  });
  template.applyPublished('meta-template-1', 'APPROVED');
  return template;
}

describe('DeleteTemplateHandler', () => {
  let accounts: FakeWhatsAppAccountRepository;
  let templates: FakeTemplateRepository;
  let provider: FakeTemplateProvider;
  let handler: DeleteTemplateHandler;
  const tenantId = UniqueId.create().value;

  beforeEach(() => {
    accounts = new FakeWhatsAppAccountRepository();
    templates = new FakeTemplateRepository();
    provider = new FakeTemplateProvider();
    handler = new DeleteTemplateHandler(
      templates,
      provider,
      new TemplateAccountResolverService(accounts),
    );
  });

  it('exclui um template publicado com sucesso', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    const template = createPublishedTemplate(tenantId, account.id);
    templates.seed(tenantId, template);

    const result = await handler.execute(new DeleteTemplateCommand(tenantId, template.id.value));

    expectOk(result);
    expect(templates.removed).toEqual([template]);
  });

  it('falha com TemplateNotFoundError quando o template não existe', async () => {
    const result = await handler.execute(
      new DeleteTemplateCommand(tenantId, UniqueId.create().value),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(TemplateNotFoundError);
    expect(templates.removed).toHaveLength(0);
  });

  it('falha com MetaTemplateIdRequiredError quando o template ainda não foi publicado', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    const draft = Template.create({
      tenantId: UniqueId.create(tenantId),
      whatsAppAccountId: account.id,
      name: 'rascunho',
      language: 'pt_BR',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Olá!' }],
      parameterFormat: null,
    });
    templates.seed(tenantId, draft);

    const result = await handler.execute(new DeleteTemplateCommand(tenantId, draft.id.value));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(MetaTemplateIdRequiredError);
    expect(templates.removed).toHaveLength(0);
  });

  it('falha quando o provedor rejeita a exclusão e não remove o template local', async () => {
    const account = createAccount(tenantId);
    accounts.seed(account);
    const template = createPublishedTemplate(tenantId, account.id);
    templates.seed(tenantId, template);
    const providerError = new ProviderUnavailableError('Meta indisponível');
    provider.deleteResult = Result.fail(providerError);

    const result = await handler.execute(new DeleteTemplateCommand(tenantId, template.id.value));

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(providerError);
    expect(templates.removed).toHaveLength(0);
  });
});
