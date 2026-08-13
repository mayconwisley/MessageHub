import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import { TemplateEditNotAllowedError } from '../../domain/errors/template-edit-not-allowed.error';
import { TemplateNotFoundError } from '../../domain/errors/template-not-found.error';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ITemplateProvider, TEMPLATE_PROVIDER } from '../ports/template-provider.interface';
import { UpdateTemplateCommand } from '../commands/update-template.command';
import { TemplateDto } from '../dto/template.dto';
import { TemplateMapper } from '../mappers/template.mapper';
import { TemplateAccountResolverService } from '../services/template-account-resolver.service';
import { TemplateExamplesValidator } from '../services/template-examples.validator';

@CommandHandler(UpdateTemplateCommand)
export class UpdateTemplateHandler implements ICommandHandler<UpdateTemplateCommand> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
    private readonly accountResolver: TemplateAccountResolverService,
  ) {}

  async execute(command: UpdateTemplateCommand): Promise<Result<TemplateDto, BaseError>> {
    const { tenantId, id, definition } = command;
    const examplesValidation = TemplateExamplesValidator.validate({
      components: definition.components,
    });
    if (examplesValidation.isFailure) return Result.fail(examplesValidation.error);
    const template = await this.templates.findById(UniqueId.create(tenantId), UniqueId.create(id));
    if (!template) return Result.fail(new TemplateNotFoundError());
    const account = await this.accountResolver.resolve(tenantId, template.whatsAppAccountId.value);
    if (account.isFailure) return Result.fail(account.error);
    if (!template.metaTemplateId) {
      template.updateDraft(definition.category, definition.components, definition.parameterFormat);
      await this.templates.save(template);
      return Result.ok(TemplateMapper.toDto(template));
    }
    if (template.status !== TemplateStatus.APPROVED) {
      return Result.fail(new TemplateEditNotAllowedError());
    }
    const result = await this.provider.update(account.value, template.metaTemplateId, definition);
    if (result.isFailure) {
      template.registerPublishFailure(result.error.message);
      await this.templates.save(template);
      return Result.fail(result.error);
    }
    template.applyMetaEdit(definition.category, definition.components, definition.parameterFormat);
    await this.templates.save(template);
    return Result.ok(TemplateMapper.toDto(template));
  }
}
