import { Command } from '@shared/mediator';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';

export class RemoveEmailSmtpCommand extends Command<Result<void, BaseError>> {
  constructor(public readonly tenantId: string) {
    super();
  }
}
