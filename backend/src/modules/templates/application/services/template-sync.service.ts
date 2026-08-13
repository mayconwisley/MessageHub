import { Inject, Injectable } from '@nestjs/common';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { Template } from '../../domain/entities/template.entity';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ITemplateProvider, TEMPLATE_PROVIDER } from '../ports/template-provider.interface';
import { SyncTemplatesResult } from '../dto/template.dto';
import { TemplateAccountResolverService } from './template-account-resolver.service';

/** Reconcilia o catálogo local de templates com o estado remoto na Meta. */
@Injectable()
export class TemplateSyncService {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
    private readonly accountResolver: TemplateAccountResolverService,
  ) {}

  async sync(
    tenantId: string,
    accountId: string,
  ): Promise<Result<SyncTemplatesResult, BaseError>> {
    const account = await this.accountResolver.resolve(tenantId, accountId);
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
    for (const template of local) {
      if (template.metaTemplateId && !remoteIds.has(template.metaTemplateId)) {
        await this.templates.remove(template);
        deleted++;
      }
    }
    return Result.ok({ total: remote.value.length, created, updated, deleted });
  }
}
