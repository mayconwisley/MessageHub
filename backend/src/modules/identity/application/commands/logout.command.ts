import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { BaseError } from '@shared/errors';

export class LogoutCommand extends Command<Result<void, BaseError>> {
  constructor(public readonly token: string | undefined) {
    super();
  }
}
