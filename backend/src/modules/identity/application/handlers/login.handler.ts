import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '@shared/result';
import { AccountLockedError } from '../../domain/errors/account-locked.error';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { LoginCommand } from '../commands/login.command';
import { AuthenticatedSessionDto } from '../dto/authenticated-session.dto';
import { UserSessionService } from '../services/user-session.service';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(private readonly sessions: UserSessionService) {}

  async execute(
    command: LoginCommand,
  ): Promise<Result<AuthenticatedSessionDto, InvalidCredentialsError | AccountLockedError>> {
    const outcome = await this.sessions.authenticate(command.email, command.password, {
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });
    if (outcome.status === 'ok') return Result.ok(outcome.session);
    if (outcome.status === 'locked')
      return Result.fail(new AccountLockedError(outcome.lockedUntil));
    return Result.fail(new InvalidCredentialsError());
  }
}
