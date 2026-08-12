import { UniqueId } from '@shared/domain';
import { Template } from '../entities/template.entity';

export interface ITemplateRepository {
  save(template: Template): Promise<void>;
  remove(template: Template): Promise<void>;
  findById(tenantId: UniqueId, id: UniqueId): Promise<Template | null>;
  findByMetaId(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    metaTemplateId: string,
  ): Promise<Template | null>;
  findByNameAndLanguage(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    name: string,
    language: string,
  ): Promise<Template | null>;
  findByName(tenantId: UniqueId, whatsAppAccountId: UniqueId, name: string): Promise<Template[]>;
  list(tenantId: UniqueId, whatsAppAccountId: UniqueId): Promise<Template[]>;
}
export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
