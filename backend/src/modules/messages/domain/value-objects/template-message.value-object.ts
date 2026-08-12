import { ValueObject } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidMessageError } from '../errors/invalid-message.error';

export type TemplateParameterComponent = 'header' | 'body' | 'button';

export interface TemplateParameterGroup {
  component: TemplateParameterComponent;
  index?: number;
  action?: 'quickReply' | 'url';
  values: string[];
}

interface TemplateMessageProps {
  metaTemplateId: string | null;
  name: string;
  language: string;
  parameters: TemplateParameterGroup[];
}

export class TemplateMessage extends ValueObject<TemplateMessageProps> {
  private constructor(props: TemplateMessageProps) {
    super(props);
  }

  static create(params: TemplateMessageProps): Result<TemplateMessage, InvalidMessageError> {
    const name = params.name?.trim();
    const language = params.language?.trim();
    if (!name || !language) {
      return Result.fail(new InvalidMessageError('Template name and language must be informed.'));
    }

    const parameters = params.parameters ?? [];
    for (const parameter of parameters) {
      if (!['header', 'body', 'button'].includes(parameter.component)) {
        return Result.fail(new InvalidMessageError('Invalid template parameter component.'));
      }
      if (parameter.component === 'button' && parameter.index === undefined) {
        return Result.fail(new InvalidMessageError('Button template parameters require an index.'));
      }
      if (
        parameter.component === 'button' &&
        !['quickReply', 'url'].includes(parameter.action ?? '')
      ) {
        return Result.fail(new InvalidMessageError('Button template parameters require an action.'));
      }
      if (parameter.index !== undefined && (!Number.isInteger(parameter.index) || parameter.index < 0)) {
        return Result.fail(new InvalidMessageError('Template parameter index must be a non-negative integer.'));
      }
      if (!Array.isArray(parameter.values) || parameter.values.some((value) => !value?.trim())) {
        return Result.fail(new InvalidMessageError('Template parameter values must be non-empty strings.'));
      }
    }

    return Result.ok(
      new TemplateMessage({
        metaTemplateId: params.metaTemplateId?.trim() || null,
        name,
        language,
        parameters: parameters.map((parameter) => ({
          component: parameter.component,
          ...(parameter.index !== undefined ? { index: parameter.index } : {}),
          ...(parameter.action ? { action: parameter.action } : {}),
          values: parameter.values.map((value) => value.trim()),
        })),
      }),
    );
  }

  get metaTemplateId(): string | null { return this.props.metaTemplateId; }
  get name(): string { return this.props.name; }
  get language(): string { return this.props.language; }
  get parameters(): TemplateParameterGroup[] { return this.props.parameters; }
}
