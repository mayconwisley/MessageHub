import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BaseError } from '@shared/errors';
import { Result } from '@shared/result';
import { LogoutCommand } from '../commands/logout.command';
import { UserSessionService } from '../services/user-session.service';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly sessions: UserSessionService) {}

  async execute(command: LogoutCommand): Promise<Result<void, BaseError>> {
    if (command.token) await this.sessions.revokeSession(command.token);
    return Result.ok(undefined);
  }
}
