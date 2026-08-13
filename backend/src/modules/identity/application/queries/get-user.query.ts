import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserDto } from '../dto/user.dto';

export class GetUserQuery extends Query<Result<UserDto, UserNotFoundError>> {
  constructor(public readonly userId: string) {
    super();
  }
}
