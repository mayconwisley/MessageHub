import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import { CreatedApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';

export class CreateApiKeyCommand extends Command<
  Result<CreatedApiKeyDto, ApplicationNotFoundError>
> {
  constructor(
    public readonly applicationId: string,
    public readonly expiresAt?: Date,
    public readonly type: ApiKeyType = ApiKeyType.PLATFORM,
    public readonly scopes?: string[],
  ) {
    super();
  }
}
