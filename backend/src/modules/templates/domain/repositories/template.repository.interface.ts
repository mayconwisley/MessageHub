import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { Template } from '../entities/template.entity';
import { TemplateStatus } from '../enums/template-status.enum';

export interface ListTemplatesFilter {
  status?: TemplateStatus;
  category?: string;
}

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
  /** Lista completa (sem paginacao) - usada internamente por sync/publishPending. */
  list(tenantId: UniqueId, whatsAppAccountId: UniqueId): Promise<Template[]>;
  listPaginated(
    tenantId: UniqueId,
    whatsAppAccountId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListTemplatesFilter,
  ): Promise<PaginatedResult<Template>>;
}
export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
