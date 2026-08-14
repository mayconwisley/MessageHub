import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { InvalidUserEmailError } from '../../domain/errors/invalid-user-email.error';
import { InvalidUserNameError } from '../../domain/errors/invalid-user-name.error';
import { InvalidUserTenantAssignmentError } from '../../domain/errors/invalid-user-tenant-assignment.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserDto } from '../dto/user.dto';

export class UpdateUserCommand extends Command<
  Result<
    UserDto,
    | UserNotFoundError
    | InvalidUserNameError
    | InvalidUserEmailError
    | EmailAlreadyInUseError
    | InvalidUserTenantAssignmentError
  >
> {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly email?: string,
    public readonly role?: UserRole,
    public readonly tenantId?: string | null,
  ) {
    super();
  }
}
