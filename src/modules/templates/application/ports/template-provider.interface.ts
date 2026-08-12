import { WhatsAppAccount } from '@modules/whatsapp-accounts/domain/entities/whatsapp-account.entity';
import { Result } from '@shared/result';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';

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
  ): Promise<Result<TemplateSummary, ProviderUnavailableError>>;
  list(account: WhatsAppAccount): Promise<Result<TemplateSummary[], ProviderUnavailableError>>;
  update(
    account: WhatsAppAccount,
    templateId: string,
    template: Omit<TemplateDefinition, 'name' | 'language'>,
  ): Promise<Result<void, ProviderUnavailableError>>;
  delete(
    account: WhatsAppAccount,
    templateId: string,
    name: string,
  ): Promise<Result<void, ProviderUnavailableError>>;
}

export const TEMPLATE_PROVIDER = Symbol('TEMPLATE_PROVIDER');
