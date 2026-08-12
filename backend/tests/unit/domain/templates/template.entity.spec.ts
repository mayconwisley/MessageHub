import { UniqueId } from '@shared/domain';
import { Template } from '@modules/templates/domain/entities/template.entity';
import { TemplateStatus } from '@modules/templates/domain/enums/template-status.enum';

function createTemplate(): Template {
  return Template.create({
    tenantId: UniqueId.create(),
    whatsAppAccountId: UniqueId.create(),
    name: 'order_confirmation',
    language: 'pt_BR',
    category: 'UTILITY',
    components: [{ type: 'BODY', text: 'Pedido confirmado' }],
    parameterFormat: 'POSITIONAL',
  });
}

describe('Template', () => {
  it('starts as a local draft and retains a provider rejection for republishing', () => {
    const template = createTemplate();
    expect(template.status).toBe(TemplateStatus.DRAFT);
    template.registerPublishFailure('Meta rejected the template.');
    expect(template.lastError).toBe('Meta rejected the template.');
  });

  it('moves to the Meta status after publication and to pending after an edit', () => {
    const template = createTemplate();
    template.applyPublished('meta-template-id', 'APPROVED');
    expect(template.metaTemplateId).toBe('meta-template-id');
    expect(template.status).toBe(TemplateStatus.APPROVED);
    template.applyMetaEdit('UTILITY', [{ type: 'BODY', text: 'Conteúdo atualizado' }]);
    expect(template.status).toBe(TemplateStatus.PENDING);
    expect(template.components[0].text).toBe('Conteúdo atualizado');
  });
});
