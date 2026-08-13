import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';

export class DeleteTemplateCommand extends Command<Result<void, BaseError>> {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {
    super();
  }
}
