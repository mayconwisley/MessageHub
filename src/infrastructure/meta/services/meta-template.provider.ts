import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { Result } from '@shared/result';
import {
  ITemplateProvider,
  TemplateDefinition,
  TemplateSummary,
} from '@modules/templates/application/ports/template-provider.interface';
import { MetaErrorMapper } from '../errors/meta-error.mapper';
import {
  MetaTemplateCredentials,
  MetaTemplateResponse,
  MetaWhatsAppClient,
} from '../clients/meta-whatsapp.client';

@Injectable()
export class MetaTemplateProvider implements ITemplateProvider {
  constructor(
    private readonly client: MetaWhatsAppClient,
    private readonly config: MetaConfigService,
  ) {}

  async create(
    account: WhatsAppAccount,
    template: TemplateDefinition,
  ): Promise<Result<TemplateSummary, ProviderUnavailableError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('Meta credentials are not configured.'));
    try {
      const created = await this.client.createTemplate(
        credentials,
        this.toMetaDefinition(template),
      );
      return Result.ok({ ...template, id: created.id, status: created.status ?? 'PENDING' });
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }

  async list(
    account: WhatsAppAccount,
  ): Promise<Result<TemplateSummary[], ProviderUnavailableError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('Meta credentials are not configured.'));
    try {
      return Result.ok(
        (await this.client.listTemplates(credentials)).map((template) => this.toSummary(template)),
      );
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }

  async update(
    account: WhatsAppAccount,
    templateId: string,
    template: Omit<TemplateDefinition, 'name' | 'language'>,
  ): Promise<Result<void, ProviderUnavailableError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('Meta credentials are not configured.'));
    try {
      await this.client.updateTemplate(credentials, templateId, this.toMetaDefinition(template));
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }

  async delete(
    account: WhatsAppAccount,
    templateId: string,
    name: string,
  ): Promise<Result<void, ProviderUnavailableError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('Meta credentials are not configured.'));
    try {
      await this.client.deleteTemplate(credentials, templateId, name);
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(MetaErrorMapper.toProviderError(error));
    }
  }

  private credentials(account: WhatsAppAccount): MetaTemplateCredentials | null {
    const accessToken =
      account.credentialSource === WhatsAppCredentialSource.DEFAULT
        ? this.config.defaultChannelEnabled
          ? this.config.defaultAccessToken
          : null
        : account.accessToken;
    return accessToken ? { wabaId: account.wabaId, accessToken } : null;
  }

  private toMetaDefinition(
    template: Omit<TemplateDefinition, 'name' | 'language'> | TemplateDefinition,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      category: template.category,
      components: template.components,
    };
    if ('name' in template) {
      payload.name = template.name;
      payload.language = template.language;
    }
    if (template.parameterFormat) payload.parameter_format = template.parameterFormat;
    return payload;
  }

  private toSummary(template: MetaTemplateResponse): TemplateSummary {
    return {
      id: template.id,
      name: template.name,
      language: template.language,
      category: template.category,
      status: template.status,
      components: template.components,
      parameterFormat: template.parameter_format,
      rejectedReason: template.rejected_reason,
    };
  }
}
