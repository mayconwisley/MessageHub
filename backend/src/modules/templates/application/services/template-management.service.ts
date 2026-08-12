import { Inject, Injectable } from '@nestjs/common';
import { BaseError, DomainError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { Template } from '../../domain/entities/template.entity';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import {
  ITemplateRepository,
  ListTemplatesFilter,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import {
  ITemplateProvider,
  TEMPLATE_PROVIDER,
  TemplateDefinition,
  TemplateSummary,
} from '../ports/template-provider.interface';
import { TemplateExamplesValidator } from './template-examples.validator';

class TemplateError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message);
  }
}
export interface TemplateDto extends TemplateSummary {
  localId: string;
  whatsAppAccountId: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface SyncTemplatesResult {
  total: number;
  created: number;
  updated: number;
  deleted: number;
}
export interface PublishPendingResult {
  published: number;
  failed: number;
  skipped: number;
}

@Injectable()
export class TemplateManagementService {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY) private readonly accounts: IWhatsAppAccountRepository,
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
  ) {}

  async create(
    tenantId: string,
    accountId: string,
    definition: TemplateDefinition,
  ): Promise<Result<TemplateDto, BaseError>> {
    const examplesValidation = TemplateExamplesValidator.validate(definition);
    if (examplesValidation.isFailure) return Result.fail(examplesValidation.error);
    const account = await this.resolveAccount(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const duplicate = await this.templates.findByNameAndLanguage(
      UniqueId.create(tenantId),
      account.value.id,
      definition.name.trim(),
      definition.language.trim(),
    );
    if (duplicate?.metaTemplateId)
      return Result.fail(
        new TemplateError(
          'TEMPLATE_ALREADY_EXISTS',
          'Já existe um template com este nome e idioma.',
        ),
      );
    const template =
      duplicate ??
      Template.create({
        tenantId: UniqueId.create(tenantId),
        whatsAppAccountId: account.value.id,
        name: definition.name.trim(),
        language: definition.language.trim(),
        category: definition.category.trim(),
        components: definition.components,
        parameterFormat: definition.parameterFormat?.trim() || null,
      });
    if (duplicate)
      template.updateDraft(definition.category, definition.components, definition.parameterFormat);
    await this.templates.save(template);
    const published = await this.provider.create(account.value, definition);
    if (published.isFailure) {
      template.registerPublishFailure(published.error.message);
      await this.templates.save(template);
      return Result.fail(published.error);
    }
    template.applyPublished(published.value.id, published.value.status, published.value.category);
    await this.templates.save(template);
    return Result.ok(this.toDto(template));
  }

  async list(
    tenantId: string,
    accountId: string,
    synchronize = false,
    page = 1,
    pageSize = 20,
    filter?: ListTemplatesFilter,
  ): Promise<Result<PaginatedResult<TemplateDto>, BaseError>> {
    if (synchronize) {
      const sync = await this.sync(tenantId, accountId);
      if (sync.isFailure) return Result.fail(sync.error);
    }
    const account = await this.resolveAccount(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const result = await this.templates.listPaginated(
      UniqueId.create(tenantId),
      account.value.id,
      page,
      pageSize,
      filter,
    );
    return Result.ok({ ...result, items: result.items.map((template) => this.toDto(template)) });
  }

  async getById(tenantId: string, id: string): Promise<Result<TemplateDto, BaseError>> {
    const template = await this.templates.findById(UniqueId.create(tenantId), UniqueId.create(id));
    return template
      ? Result.ok(this.toDto(template))
      : Result.fail(new TemplateError('TEMPLATE_NOT_FOUND', 'Template não foi encontrado.'));
  }

  async sync(tenantId: string, accountId: string): Promise<Result<SyncTemplatesResult, BaseError>> {
    const account = await this.resolveAccount(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const remote = await this.provider.list(account.value);
    if (remote.isFailure) return Result.fail(remote.error);
    const tenant = UniqueId.create(tenantId);
    const local = await this.templates.list(tenant, account.value.id);
    const remoteIds = new Set(remote.value.map((template) => template.id));
    let created = 0;
    let updated = 0;
    let deleted = 0;
    for (const remoteTemplate of remote.value) {
      const existing =
        (await this.templates.findByMetaId(tenant, account.value.id, remoteTemplate.id)) ??
        (await this.templates.findByNameAndLanguage(
          tenant,
          account.value.id,
          remoteTemplate.name,
          remoteTemplate.language,
        ));
      if (existing) {
        existing.applyMetaSnapshot(remoteTemplate);
        await this.templates.save(existing);
        updated++;
      } else {
        const imported = Template.create({
          tenantId: tenant,
          whatsAppAccountId: account.value.id,
          name: remoteTemplate.name,
          language: remoteTemplate.language,
          category: remoteTemplate.category,
          components: remoteTemplate.components,
          parameterFormat: remoteTemplate.parameterFormat ?? null,
        });
        imported.applyMetaSnapshot(remoteTemplate);
        await this.templates.save(imported);
        created++;
      }
    }
    for (const template of local)
      if (template.metaTemplateId && !remoteIds.has(template.metaTemplateId)) {
        await this.templates.remove(template);
        deleted++;
      }
    return Result.ok({ total: remote.value.length, created, updated, deleted });
  }

  async publishPending(
    tenantId: string,
    accountId: string,
  ): Promise<Result<PublishPendingResult, BaseError>> {
    const account = await this.resolveAccount(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const drafts = (await this.templates.list(UniqueId.create(tenantId), account.value.id)).filter(
      (template) => !template.metaTemplateId && template.status === TemplateStatus.DRAFT,
    );
    let published = 0;
    let failed = 0;
    for (const template of drafts) {
      const definition = this.toDefinition(template);
      const examplesValidation = TemplateExamplesValidator.validate(definition);
      if (examplesValidation.isFailure) {
        template.registerPublishFailure(examplesValidation.error.message);
        await this.templates.save(template);
        failed++;
        continue;
      }
      const result = await this.provider.create(account.value, definition);
      if (result.isFailure) {
        template.registerPublishFailure(result.error.message);
        await this.templates.save(template);
        failed++;
        continue;
      }
      template.applyPublished(result.value.id, result.value.status, result.value.category);
      await this.templates.save(template);
      published++;
    }
    return Result.ok({ published, failed, skipped: 0 });
  }

  async update(
    tenantId: string,
    id: string,
    definition: Omit<TemplateDefinition, 'name' | 'language'>,
  ): Promise<Result<TemplateDto, BaseError>> {
    const examplesValidation = TemplateExamplesValidator.validate({
      components: definition.components,
    });
    if (examplesValidation.isFailure) return Result.fail(examplesValidation.error);
    const template = await this.templates.findById(UniqueId.create(tenantId), UniqueId.create(id));
    if (!template)
      return Result.fail(new TemplateError('TEMPLATE_NOT_FOUND', 'Template não foi encontrado.'));
    const account = await this.resolveAccount(tenantId, template.whatsAppAccountId.value);
    if (account.isFailure) return Result.fail(account.error);
    if (!template.metaTemplateId) {
      template.updateDraft(definition.category, definition.components, definition.parameterFormat);
      await this.templates.save(template);
      return Result.ok(this.toDto(template));
    }
    if (template.status !== TemplateStatus.APPROVED)
      return Result.fail(
        new TemplateError(
          'TEMPLATE_EDIT_NOT_ALLOWED',
          'Somente templates aprovados pela Meta podem ser editados.',
        ),
      );
    const result = await this.provider.update(account.value, template.metaTemplateId, definition);
    if (result.isFailure) {
      template.registerPublishFailure(result.error.message);
      await this.templates.save(template);
      return Result.fail(result.error);
    }
    template.applyMetaEdit(definition.category, definition.components, definition.parameterFormat);
    await this.templates.save(template);
    return Result.ok(this.toDto(template));
  }

  async delete(tenantId: string, id: string): Promise<Result<void, BaseError>> {
    const template = await this.templates.findById(UniqueId.create(tenantId), UniqueId.create(id));
    if (!template)
      return Result.fail(new TemplateError('TEMPLATE_NOT_FOUND', 'Template não foi encontrado.'));
    if (!template.metaTemplateId)
      return Result.fail(
        new TemplateError(
          'META_TEMPLATE_ID_REQUIRED',
          'Templates em rascunho devem ser publicados antes da exclusão.',
        ),
      );
    const account = await this.resolveAccount(tenantId, template.whatsAppAccountId.value);
    if (account.isFailure) return Result.fail(account.error);
    const result = await this.provider.delete(
      account.value,
      template.metaTemplateId,
      template.name,
    );
    if (result.isFailure) return Result.fail(result.error);
    await this.templates.remove(template);
    return Result.ok(undefined);
  }

  private async resolveAccount(
    tenantId: string,
    accountId: string,
  ): Promise<Result<WhatsAppAccount, BaseError>> {
    const account = await this.accounts.findById(UniqueId.create(accountId));
    if (!account)
      return Result.fail(
        new TemplateError('WHATSAPP_ACCOUNT_NOT_FOUND', 'Conta do WhatsApp não foi encontrada.'),
      );
    if (account.tenantId.value !== tenantId)
      return Result.fail(
        new TemplateError(
          'WHATSAPP_ACCOUNT_ACCESS_DENIED',
          'A conta do WhatsApp não pertence ao tenant autenticado.',
        ),
      );
    return Result.ok(account);
  }
  private toDefinition(template: Template): TemplateDefinition {
    return {
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
      parameterFormat: template.parameterFormat ?? undefined,
    };
  }
  private toDto(template: Template): TemplateDto {
    return {
      ...this.toDefinition(template),
      id: template.metaTemplateId ?? '',
      localId: template.id.value,
      whatsAppAccountId: template.whatsAppAccountId.value,
      status: template.status,
      rejectedReason: template.rejectedReason ?? undefined,
      lastError: template.lastError ?? undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
