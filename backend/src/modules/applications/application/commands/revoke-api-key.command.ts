import { Command } from '@shared/mediator';
import { Result } from '@shared/result';
import { ApiKeyNotFoundError } from '../../domain/errors/api-key-not-found.error';

export class RevokeApiKeyCommand extends Command<Result<void, ApiKeyNotFoundError>> {
  constructor(
    public readonly apiKeyId: string,
    public readonly applicationId: string,
  ) {
    super();
  }
}
