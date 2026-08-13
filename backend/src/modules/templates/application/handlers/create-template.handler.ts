import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { Template } from '../../domain/entities/template.entity';
import { TemplateAlreadyExistsError } from '../../domain/errors/template-already-exists.error';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ITemplateProvider, TEMPLATE_PROVIDER } from '../ports/template-provider.interface';
import { CreateTemplateCommand } from '../commands/create-template.command';
import { TemplateDto } from '../dto/template.dto';
import { TemplateMapper } from '../mappers/template.mapper';
import { TemplateAccountResolverService } from '../services/template-account-resolver.service';
import { TemplateExamplesValidator } from '../services/template-examples.validator';

@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler implements ICommandHandler<CreateTemplateCommand> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
    private readonly accountResolver: TemplateAccountResolverService,
  ) {}

  async execute(command: CreateTemplateCommand): Promise<Result<TemplateDto, BaseError>> {
    const { tenantId, accountId, definition } = command;
    const examplesValidation = TemplateExamplesValidator.validate(definition);
    if (examplesValidation.isFailure) return Result.fail(examplesValidation.error);
    const account = await this.accountResolver.resolve(tenantId, accountId);
    if (account.isFailure) return Result.fail(account.error);
    const duplicate = await this.templates.findByNameAndLanguage(
      UniqueId.create(tenantId),
      account.value.id,
      definition.name.trim(),
      definition.language.trim(),
    );
    if (duplicate?.metaTemplateId) {
      return Result.fail(new TemplateAlreadyExistsError());
    }
    const template =
      duplicate ??
      Template.create({
        tenantId: UniqueId.create(tenantId),
        whatsAppAccountId: account.value.id,
        name: definition.name.trim(),
        language: definition.language.trim(),
        category: definition.category.trim(),
        components: definition.components,
        parameterFormat: definition.parameterFormat?.trim() || null,
      });
    if (duplicate) {
      template.updateDraft(definition.category, definition.components, definition.parameterFormat);
    }
    await this.templates.save(template);
    const published = await this.provider.create(account.value, definition);
    if (published.isFailure) {
      template.registerPublishFailure(published.error.message);
      await this.templates.save(template);
      return Result.fail(published.error);
    }
    template.applyPublished(published.value.id, published.value.status, published.value.category);
    await this.templates.save(template);
    return Result.ok(TemplateMapper.toDto(template));
  }
}
