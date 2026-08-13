import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { SyncTemplatesCommand } from '../commands/sync-templates.command';
import { SyncTemplatesResult } from '../dto/template.dto';
import { TemplateSyncService } from '../services/template-sync.service';

@CommandHandler(SyncTemplatesCommand)
export class SyncTemplatesHandler implements ICommandHandler<SyncTemplatesCommand> {
  constructor(private readonly syncService: TemplateSyncService) {}

  execute(command: SyncTemplatesCommand): Promise<Result<SyncTemplatesResult, BaseError>> {
    return this.syncService.sync(command.tenantId, command.accountId);
  }
}
