import { BaseError } from '@shared/errors';

export class TemplateNotFoundError extends BaseError {
  constructor(reference: string) {
    super('TEMPLATE_NOT_FOUND', `Template '${reference}' was not found for the selected phone number.`);
  }
}
