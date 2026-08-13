import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ITemplateProvider, TEMPLATE_PROVIDER } from '../ports/template-provider.interface';
import { PublishPendingTemplatesCommand } from '../commands/publish-pending-templates.command';
import { PublishPendingResult } from '../dto/template.dto';
import { TemplateMapper } from '../mappers/template.mapper';
import { TemplateAccountResolverService } from '../services/template-account-resolver.service';
import { TemplateExamplesValidator } from '../services/template-examples.validator';

@CommandHandler(PublishPendingTemplatesCommand)
export class PublishPendingTemplatesHandler
  implements ICommandHandler<PublishPendingTemplatesCommand>
{
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
    private readonly accountResolver: TemplateAccountResolverService,
  ) {}

  async execute(
    command: PublishPendingTemplatesCommand,
  ): Promise<Result<PublishPendingResult, BaseError>> {
    const account = await this.accountResolver.resolve(command.tenantId, command.accountId);
    if (account.isFailure) return Result.fail(account.error);
    const drafts = (
      await this.templates.list(UniqueId.create(command.tenantId), account.value.id)
    ).filter((template) => !template.metaTemplateId && template.status === TemplateStatus.DRAFT);
    let published = 0;
    let failed = 0;
    for (const template of drafts) {
      const definition = TemplateMapper.toDefinition(template);
      const examplesValidation = TemplateExamplesValidator.validate(definition);
      if (examplesValidation.isFailure) {
        template.registerPublishFailure(examplesValidation.error.message);
        await this.templates.save(template);
        failed++;
        continue;
      }
      const result = await this.provider.create(account.value, definition);
      if (result.isFailure) {
        template.registerPublishFailure(result.error.message);
        await this.templates.save(template);
        failed++;
        continue;
      }
      template.applyPublished(result.value.id, result.value.status, result.value.category);
      await this.templates.save(template);
      published++;
    }
    return Result.ok({ published, failed, skipped: 0 });
  }
}
