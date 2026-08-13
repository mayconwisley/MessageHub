import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { TemplateDefinition } from '../ports/template-provider.interface';
import { TemplateDto } from '../dto/template.dto';

export class UpdateTemplateCommand extends Command<Result<TemplateDto, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
    public readonly definition: Omit<TemplateDefinition, 'name' | 'language'>,
  ) {
    super();
  }
}
