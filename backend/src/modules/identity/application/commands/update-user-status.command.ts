import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { UserDto } from '../dto/user.dto';

export class UpdateUserStatusCommand extends Command<Result<UserDto, UserNotFoundError>> {
  constructor(
    public readonly userId: string,
    public readonly status: UserStatus,
  ) {
    super();
  }
}
