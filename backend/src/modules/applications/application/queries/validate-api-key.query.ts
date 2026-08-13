import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { InvalidApiKeyError } from '../../domain/errors/invalid-api-key.error';
import { AuthContextDto } from '../dto/api-key.dto';

export class ValidateApiKeyQuery extends Query<Result<AuthContextDto, InvalidApiKeyError>> {
  constructor(
    public readonly plainTextKey: string,
    public readonly ipAddress?: string,
  ) {
    super();
  }
}
