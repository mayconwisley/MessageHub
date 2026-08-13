import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { UpdateUserStatusCommand } from '../commands/update-user-status.command';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@CommandHandler(UpdateUserStatusCommand)
export class UpdateUserStatusHandler implements ICommandHandler<UpdateUserStatusCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(command: UpdateUserStatusCommand): Promise<Result<UserDto, UserNotFoundError>> {
    const user = await this.users.findById(UniqueId.create(command.userId));
    if (!user) {
      return Result.fail(new UserNotFoundError(command.userId));
    }

    if (command.status === UserStatus.SUSPENDED) {
      user.suspend();
    } else {
      user.activate();
    }
    await this.users.save(user);

    return Result.ok(UserMapper.toDto(user));
  }
}
