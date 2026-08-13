import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { SyncTemplatesResult } from '../dto/template.dto';

export class SyncTemplatesCommand extends Command<Result<SyncTemplatesResult, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly accountId: string,
  ) {
    super();
  }
}
