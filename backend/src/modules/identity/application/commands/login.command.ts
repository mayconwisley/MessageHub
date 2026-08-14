import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AuthenticatedSessionDto } from '../dto/authenticated-session.dto';

export class LoginCommand extends Command<
  Result<AuthenticatedSessionDto, InvalidCredentialsError>
> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }
}
