import { DomainError } from '@shared/errors';

export class TemplateAlreadyExistsError extends DomainError {
  constructor() {
    super('TEMPLATE_ALREADY_EXISTS', 'Já existe um template com este nome e idioma.');
  }
}
