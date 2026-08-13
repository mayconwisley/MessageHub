import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as bcrypt from 'bcryptjs';
import { Result } from '@shared/result';
import { User } from '../../domain/entities/user.entity';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { InvalidUserEmailError } from '../../domain/errors/invalid-user-email.error';
import { InvalidUserNameError } from '../../domain/errors/invalid-user-name.error';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { CreateUserCommand } from '../commands/create-user.command';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

const PASSWORD_COST = 12;

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly users: IUserRepository) {}

  async execute(
    command: CreateUserCommand,
  ): Promise<
    Result<UserDto, InvalidUserNameError | InvalidUserEmailError | EmailAlreadyInUseError>
  > {
    const email = command.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      return Result.fail(new EmailAlreadyInUseError(email));
    }

    const passwordHash = await bcrypt.hash(command.password, PASSWORD_COST);
    const userResult = User.create({
      name: command.name,
      email: command.email,
      passwordHash,
      role: command.role,
      tenantId: command.tenantId,
    });
    if (userResult.isFailure) {
      return Result.fail(userResult.error);
    }

    const user = userResult.value;
    await this.users.save(user);

    return Result.ok(UserMapper.toDto(user));
  }
}
