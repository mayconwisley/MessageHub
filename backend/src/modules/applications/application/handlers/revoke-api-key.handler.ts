import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApiKeyNotFoundError } from '../../domain/errors/api-key-not-found.error';
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository,
} from '../../domain/repositories/api-key.repository.interface';
import { RevokeApiKeyCommand } from '../commands/revoke-api-key.command';

@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler implements ICommandHandler<RevokeApiKeyCommand> {
  constructor(@Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(command: RevokeApiKeyCommand): Promise<Result<void, ApiKeyNotFoundError>> {
    const apiKey = await this.apiKeyRepository.findById(UniqueId.create(command.apiKeyId));
    if (!apiKey) {
      return Result.fail(new ApiKeyNotFoundError(command.apiKeyId));
    }

    apiKey.revoke();
    await this.apiKeyRepository.save(apiKey);

    return Result.ok(undefined);
  }
}
