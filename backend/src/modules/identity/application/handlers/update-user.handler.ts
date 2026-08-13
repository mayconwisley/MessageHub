import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { InvalidUserEmailError } from '../../domain/errors/invalid-user-email.error';
import { InvalidUserNameError } from '../../domain/errors/invalid-user-name.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { UpdateUserCommand } from '../commands/update-user.command';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(
    command: UpdateUserCommand,
  ): Promise<
    Result<
      UserDto,
      UserNotFoundError | InvalidUserNameError | InvalidUserEmailError | EmailAlreadyInUseError
    >
  > {
    const user = await this.users.findById(UniqueId.create(command.userId));
    if (!user) {
      return Result.fail(new UserNotFoundError(command.userId));
    }

    if (command.email !== undefined) {
      const email = command.email.trim().toLowerCase();
      if (email !== user.email) {
        const existing = await this.users.findByEmail(email);
        if (existing) {
          return Result.fail(new EmailAlreadyInUseError(email));
        }
      }
    }

    const updateResult = user.updateProfile({
      name: command.name,
      email: command.email,
      role: command.role,
      tenantId: command.tenantId,
    });
    if (updateResult.isFailure) {
      return Result.fail(updateResult.error);
    }

    await this.users.save(user);

    return Result.ok(UserMapper.toDto(user));
  }
}
