import { Template } from '../../domain/entities/template.entity';
import { TemplateDefinition } from '../ports/template-provider.interface';
import { TemplateDto } from '../dto/template.dto';

export class TemplateMapper {
  static toDefinition(template: Template): TemplateDefinition {
    return {
      name: template.name,
      language: template.language,
      category: template.category,
      components: template.components,
      parameterFormat: template.parameterFormat ?? undefined,
    };
  }

  static toDto(template: Template): TemplateDto {
    return {
      ...TemplateMapper.toDefinition(template),
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
