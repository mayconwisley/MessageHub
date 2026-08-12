import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidApiKeyError } from '../../domain/errors/invalid-api-key.error';
import {
  API_KEY_REPOSITORY,
  IApiKeyRepository,
} from '../../domain/repositories/api-key.repository.interface';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import { AuthContextDto } from '../dto/api-key.dto';
import { ApiKeyGeneratorService } from '../services/api-key-generator.service';
import { ValidateApiKeyQuery } from '../queries/validate-api-key.query';

@QueryHandler(ValidateApiKeyQuery)
export class ValidateApiKeyHandler implements IQueryHandler<ValidateApiKeyQuery> {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeyRepository: IApiKeyRepository,
    @Inject(APPLICATION_REPOSITORY) private readonly applicationRepository: IApplicationRepository,
    private readonly apiKeyGenerator: ApiKeyGeneratorService,
  ) {}

  async execute(query: ValidateApiKeyQuery): Promise<Result<AuthContextDto, InvalidApiKeyError>> {
    const parsed = this.apiKeyGenerator.parse(query.plainTextKey);
    if (!parsed) {
      return Result.fail(new InvalidApiKeyError());
    }

    const apiKey = await this.apiKeyRepository.findById(UniqueId.create(parsed.apiKeyId));
    if (!apiKey) {
      return Result.fail(new InvalidApiKeyError());
    }

    const matches = await this.apiKeyGenerator.verify(parsed.secret, apiKey.hash);
    if (!matches || !apiKey.isValid()) {
      return Result.fail(new InvalidApiKeyError());
    }

    const application = await this.applicationRepository.findById(apiKey.applicationId);
    if (!application || !application.isActive()) {
      return Result.fail(new InvalidApiKeyError());
    }

    return Result.ok({
      apiKeyId: apiKey.id.value,
      applicationId: application.id.value,
      tenantId: application.tenantId.value,
      type: apiKey.type,
    });
  }
}
