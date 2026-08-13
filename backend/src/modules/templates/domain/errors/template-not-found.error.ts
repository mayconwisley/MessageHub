import { DomainError } from '@shared/errors';

export class TemplateNotFoundError extends DomainError {
  constructor() {
    super('TEMPLATE_NOT_FOUND', 'Template não foi encontrado.');
  }
}
