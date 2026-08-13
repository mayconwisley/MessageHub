import { Query } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { ListTemplatesFilter } from '../../domain/repositories/template.repository.interface';
import { TemplateDto } from '../dto/template.dto';

export class ListTemplatesQuery extends Query<Result<PaginatedResult<TemplateDto>, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly accountId: string,
    public readonly synchronize = false,
    public readonly page = 1,
    public readonly pageSize = 20,
    public readonly filter?: ListTemplatesFilter,
  ) {
    super();
  }
}
