import { Query } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { TemplateDto } from '../dto/template.dto';

export class GetTemplateQuery extends Query<Result<TemplateDto, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {
    super();
  }
}
