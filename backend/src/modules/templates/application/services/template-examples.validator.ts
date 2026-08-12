import { DomainError } from '@shared/errors';
import { Result } from '@shared/result';
import {
  TemplateComponentDefinition,
  TemplateDefinition,
} from '../ports/template-provider.interface';

class InvalidTemplateExamplesError extends DomainError {
  constructor(message: string) {
    super('INVALID_TEMPLATE_EXAMPLES', message);
  }
}

/** Valida os exemplos que a Meta exige para componentes de texto parametrizados. */
export class TemplateExamplesValidator {
  static validate(
    template: Pick<TemplateDefinition, 'components'>,
  ): Result<void, InvalidTemplateExamplesError> {
    for (const component of template.components) {
      const result = this.validateComponent(component);
      if (result.isFailure) return result;
    }
    return Result.ok(undefined);
  }

  private static validateComponent(
    component: TemplateComponentDefinition,
  ): Result<void, InvalidTemplateExamplesError> {
    const placeholders = this.placeholderIndexes(component.text);
    if (placeholders.length === 0) return Result.ok(undefined);
    const maxIndex = placeholders[placeholders.length - 1];
    if (placeholders.length !== maxIndex) {
      return Result.fail(
        new InvalidTemplateExamplesError(
          'Text placeholders must be sequential, starting at {{1}} without gaps.',
        ),
      );
    }
    const type = component.type.trim().toUpperCase();
    if (type === 'HEADER') return this.validateHeader(component, maxIndex);
    if (type === 'BODY') return this.validateBody(component, maxIndex);
    return Result.fail(
      new InvalidTemplateExamplesError(`Component ${type} does not support text placeholders.`),
    );
  }

  private static validateHeader(
    component: TemplateComponentDefinition,
    expected: number,
  ): Result<void, InvalidTemplateExamplesError> {
    const examples = component.example?.headerText;
    if (!examples || examples.length !== expected || examples.some((value) => !value.trim())) {
      return Result.fail(
        new InvalidTemplateExamplesError(
          `HEADER with ${expected} placeholder(s) requires exactly ${expected} example value(s) in example.headerText.`,
        ),
      );
    }
    return Result.ok(undefined);
  }

  private static validateBody(
    component: TemplateComponentDefinition,
    expected: number,
  ): Result<void, InvalidTemplateExamplesError> {
    const samples = component.example?.bodyText;
    if (
      !samples?.length ||
      samples.some((sample) => sample.length !== expected || sample.some((value) => !value.trim()))
    ) {
      return Result.fail(
        new InvalidTemplateExamplesError(
          `BODY with ${expected} placeholder(s) requires one or more example rows with exactly ${expected} non-empty value(s) in example.bodyText.`,
        ),
      );
    }
    return Result.ok(undefined);
  }

  private static placeholderIndexes(text?: string): number[] {
    if (!text) return [];
    const indexes = [...text.matchAll(/{{\s*(\d+)\s*}}/g)].map((match) => Number(match[1]));
    if (!indexes.length) return [];
    const unique = [...new Set(indexes)].sort((a, b) => a - b);
    return unique;
  }
}
