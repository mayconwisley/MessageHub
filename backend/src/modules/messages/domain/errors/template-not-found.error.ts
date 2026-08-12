import { BaseError } from '@shared/errors';

export class TemplateNotFoundError extends BaseError {
  constructor(reference: string) {
    super(
      'TEMPLATE_NOT_FOUND',
      `Template '${reference}' não foi encontrado para o número de telefone selecionado.`,
    );
  }
}
