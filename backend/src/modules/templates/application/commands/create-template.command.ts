import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { TemplateDefinition } from '../ports/template-provider.interface';
import { TemplateDto } from '../dto/template.dto';

export class CreateTemplateCommand extends Command<Result<TemplateDto, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly definition: TemplateDefinition,
  ) {
    super();
  }
}
