import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { ApiKey } from '../../domain/entities/api-key.entity';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository,
} from '../../domain/repositories/api-key.repository.interface';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { CreateApiKeyCommand } from '../commands/create-api-key.command';
import { CreatedApiKeyDto } from '../dto/api-key.dto';
import { ApiKeyMapper } from '../mappers/api-key.mapper';
import { ApiKeyGeneratorService } from '../services/api-key-generator.service';

@CommandHandler(CreateApiKeyCommand)
export class CreateApiKeyHandler implements ICommandHandler<CreateApiKeyCommand> {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    private readonly apiKeyGenerator: ApiKeyGeneratorService,
  ) {}

  async execute(
    command: CreateApiKeyCommand,
  ): Promise<Result<CreatedApiKeyDto, ApplicationNotFoundError>> {
    const applicationId = UniqueId.create(command.applicationId);
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(command.applicationId));
    }

    const apiKeyId = UniqueId.create();
    const generated = await this.apiKeyGenerator.generate(apiKeyId);

    const apiKey = ApiKey.create(
      {
        applicationId,
        hash: generated.hash,
        prefix: generated.prefix,
        expiresAt: command.expiresAt ?? null,
      },
      apiKeyId,
    );
    await this.apiKeyRepository.save(apiKey);

    return Result.ok({ ...ApiKeyMapper.toDto(apiKey), plainTextKey: generated.plainTextKey });
  }
}
