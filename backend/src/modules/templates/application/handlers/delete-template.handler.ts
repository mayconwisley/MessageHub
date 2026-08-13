import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { MetaTemplateIdRequiredError } from '../../domain/errors/meta-template-id-required.error';
import { TemplateNotFoundError } from '../../domain/errors/template-not-found.error';
import {
  ITemplateRepository,
  TEMPLATE_REPOSITORY,
} from '../../domain/repositories/template.repository.interface';
import { ITemplateProvider, TEMPLATE_PROVIDER } from '../ports/template-provider.interface';
import { DeleteTemplateCommand } from '../commands/delete-template.command';
import { TemplateAccountResolverService } from '../services/template-account-resolver.service';

@CommandHandler(DeleteTemplateCommand)
export class DeleteTemplateHandler implements ICommandHandler<DeleteTemplateCommand> {
  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templates: ITemplateRepository,
    @Inject(TEMPLATE_PROVIDER) private readonly provider: ITemplateProvider,
    private readonly accountResolver: TemplateAccountResolverService,
  ) {}

  async execute(command: DeleteTemplateCommand): Promise<Result<void, BaseError>> {
    const template = await this.templates.findById(
      UniqueId.create(command.tenantId),
      UniqueId.create(command.id),
    );
    if (!template) return Result.fail(new TemplateNotFoundError());
    if (!template.metaTemplateId) return Result.fail(new MetaTemplateIdRequiredError());
    const account = await this.accountResolver.resolve(
      command.tenantId,
      template.whatsAppAccountId.value,
    );
    if (account.isFailure) return Result.fail(account.error);
    const result = await this.provider.delete(
      account.value,
      template.metaTemplateId,
      template.name,
    );
    if (result.isFailure) return Result.fail(result.error);
    await this.templates.remove(template);
    return Result.ok(undefined);
  }
}
