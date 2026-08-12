import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaProviderError } from '@modules/messages/domain/errors/meta-provider-error.type';
import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { WhatsAppCredentialSource } from '@modules/whatsapp-accounts/domain/enums/whatsapp-credential-source.enum';
import { Result } from '@shared/result';
import {
  ITemplateProvider,
  TemplateComponentDefinition,
  TemplateComponentExamples,
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
  ): Promise<Result<TemplateSummary, MetaProviderError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('As credenciais da Meta não estão configuradas.'));
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
  ): Promise<Result<TemplateSummary[], MetaProviderError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('As credenciais da Meta não estão configuradas.'));
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
  ): Promise<Result<void, MetaProviderError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('As credenciais da Meta não estão configuradas.'));
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
  ): Promise<Result<void, MetaProviderError>> {
    const credentials = this.credentials(account);
    if (!credentials)
      return Result.fail(new ProviderUnavailableError('As credenciais da Meta não estão configuradas.'));
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
      components: template.components.map((component) => this.toMetaComponent(component)),
    };
    if ('name' in template) {
      payload.name = template.name;
      payload.language = template.language;
    }
    if (template.parameterFormat) payload.parameter_format = template.parameterFormat;
    return payload;
  }

  private toMetaComponent(component: TemplateComponentDefinition): Record<string, unknown> {
    const mapped: Record<string, unknown> = { type: component.type };
    if (component.format) mapped.format = component.format;
    if (component.text) mapped.text = component.text;
    if (component.buttons) mapped.buttons = component.buttons;
    if (component.location) mapped.location = component.location;
    if (component.example) mapped.example = this.toMetaExamples(component.example);
    return mapped;
  }

  private toMetaExamples(examples: TemplateComponentExamples): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};
    if (examples.headerText) mapped.header_text = examples.headerText;
    if (examples.bodyText) mapped.body_text = examples.bodyText;
    return mapped;
  }

  private toSummary(template: MetaTemplateResponse): TemplateSummary {
    return {
      id: template.id,
      name: template.name,
      language: template.language,
      category: template.category,
      status: template.status,
      components: template.components.map((component) => this.toHubComponent(component)),
      parameterFormat: template.parameter_format,
      rejectedReason: template.rejected_reason,
    };
  }

  private toHubComponent(component: Record<string, unknown>): TemplateComponentDefinition {
    return {
      type: typeof component.type === 'string' ? component.type : '',
      format: typeof component.format === 'string' ? component.format : undefined,
      text: typeof component.text === 'string' ? component.text : undefined,
      buttons: Array.isArray(component.buttons)
        ? (component.buttons as Record<string, unknown>[])
        : undefined,
      location: this.isRecord(component.location) ? component.location : undefined,
      example: this.toHubExamples(component.example),
    };
  }

  private toHubExamples(value: unknown): TemplateComponentExamples | undefined {
    if (!this.isRecord(value)) return undefined;
    const headerText = this.isStringArray(value.header_text) ? value.header_text : undefined;
    const bodyText =
      Array.isArray(value.body_text) && value.body_text.every((item) => this.isStringArray(item))
        ? value.body_text
        : undefined;
    return headerText || bodyText ? { headerText, bodyText } : undefined;
  }
  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}
