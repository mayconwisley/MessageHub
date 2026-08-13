import { DomainError } from '@shared/errors';

export class TemplateEditNotAllowedError extends DomainError {
  constructor() {
    super('TEMPLATE_EDIT_NOT_ALLOWED', 'Somente templates aprovados pela Meta podem ser editados.');
  }
}
