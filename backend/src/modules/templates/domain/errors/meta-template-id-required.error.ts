import { DomainError } from '@shared/errors';

export class MetaTemplateIdRequiredError extends DomainError {
  constructor() {
    super(
      'META_TEMPLATE_ID_REQUIRED',
      'Templates em rascunho devem ser publicados antes da exclusão.',
    );
  }
}
