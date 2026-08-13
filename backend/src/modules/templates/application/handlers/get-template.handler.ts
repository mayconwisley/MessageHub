import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TemplateNotFoundError } from '../../domain/errors/template-not-found.error';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { GetTemplateQuery } from '../queries/get-template.query';
import { TemplateDto } from '../dto/template.dto';
import { TemplateMapper } from '../mappers/template.mapper';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  constructor(@Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository) {}

  async execute(query: GetTemplateQuery): Promise<Result<TemplateDto, BaseError>> {
    const template = await this.templates.findById(
      UniqueId.create(query.tenantId),
      UniqueId.create(query.id),
    );
    return template
      ? Result.ok(TemplateMapper.toDto(template))
      : Result.fail(new TemplateNotFoundError());
  }
}
