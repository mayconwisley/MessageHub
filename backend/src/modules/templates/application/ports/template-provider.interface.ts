import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { Result } from '@shared/result';
import { MetaProviderError } from '@modules/messages/domain/errors/meta-provider-error.type';

export interface TemplateComponentExamples {
  headerText?: string[];
  bodyText?: string[][];
}

export interface TemplateComponentDefinition {
  type: string;
  format?: string;
  text?: string;
  example?: TemplateComponentExamples;
  buttons?: Record<string, unknown>[];
  location?: Record<string, unknown>;
}

export interface TemplateDefinition {
  name: string;
  language: string;
  category: string;
  components: TemplateComponentDefinition[];
  parameterFormat?: string;
}

export interface TemplateSummary extends TemplateDefinition {
  id: string;
  status: string;
  rejectedReason?: string;
}

export interface ITemplateProvider {
  create(
    account: WhatsAppAccount,
    template: TemplateDefinition,
  ): Promise<Result<TemplateSummary, MetaProviderError>>;
  list(account: WhatsAppAccount): Promise<Result<TemplateSummary[], MetaProviderError>>;
  update(
    account: WhatsAppAccount,
    templateId: string,
    template: Omit<TemplateDefinition, 'name' | 'language'>,
  ): Promise<Result<void, MetaProviderError>>;
  delete(
    account: WhatsAppAccount,
    templateId: string,
    name: string,
  ): Promise<Result<void, MetaProviderError>>;
}

export const TEMPLATE_PROVIDER = Symbol('TEMPLATE_PROVIDER');
