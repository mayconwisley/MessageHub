import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ListTemplatesQuery } from '../queries/list-templates.query';
import { TemplateDto } from '../dto/template.dto';
import { TemplateMapper } from '../mappers/template.mapper';
import { TemplateAccountResolverService } from '../services/template-account-resolver.service';
import { TemplateSyncService } from '../services/template-sync.service';

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler implements IQueryHandler<ListTemplatesQuery> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    private readonly accountResolver: TemplateAccountResolverService,
    private readonly syncService: TemplateSyncService,
  ) {}

  async execute(
    query: ListTemplatesQuery,
  ): Promise<Result<PaginatedResult<TemplateDto>, BaseError>> {
    const { tenantId, accountId } = query;
    if (query.synchronize) {
      const sync = await this.syncService.sync(tenantId, accountId);
      if (sync.isFailure) return Result.fail(sync.error);
    }
    const account = await this.accountResolver.resolve(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const result = await this.templates.listPaginated(
      account.value.tenantId,
      account.value.id,
      query.page,
      query.pageSize,
      query.filter,
    );
    return Result.ok({
      ...result,
      items: result.items.map((template) => TemplateMapper.toDto(template)),
    });
  }
}
