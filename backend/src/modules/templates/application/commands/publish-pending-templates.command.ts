import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { PublishPendingResult } from '../dto/template.dto';

export class PublishPendingTemplatesCommand extends Command<Result<PublishPendingResult, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly accountId: string,
  ) {
    super();
  }
}
