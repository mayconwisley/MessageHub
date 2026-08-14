import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';
import { ApiKey } from '@modules/applications/domain/entities/api-key.entity';
import { ApiKeyStatus } from '@modules/applications/domain/enums/api-key-status.enum';
import { ApiKeyNotFoundError } from '@modules/applications/domain/errors/api-key-not-found.error';
import { IApiKeyRepository } from '@modules/applications/domain/repositories/api-key.repository.interface';
import { RevokeApiKeyCommand } from '@modules/applications/application/commands/revoke-api-key.command';
import { RevokeApiKeyHandler } from '@modules/applications/application/handlers/revoke-api-key.handler';

class FakeApiKeyRepository implements IApiKeyRepository {
  readonly saved: ApiKey[] = [];

  constructor(private readonly apiKeys: ApiKey[] = []) {}

  async save(apiKey: ApiKey): Promise<void> {
    this.saved.push(apiKey);
  }

  async findById(id: UniqueId): Promise<ApiKey | null> {
    return this.apiKeys.find((apiKey) => apiKey.id.equals(id)) ?? null;
  }

  async listByApplicationId(): Promise<PaginatedResult<ApiKey>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }

  async recordUsage(): Promise<void> {}
}

describe('RevokeApiKeyHandler', () => {
  it('revoga a chave quando ela pertence à application informada', async () => {
    const applicationId = UniqueId.create();
    const apiKey = ApiKey.create({ applicationId, hash: 'hash', prefix: 'mh_' });
    const repository = new FakeApiKeyRepository([apiKey]);
    const handler = new RevokeApiKeyHandler(repository);

    const result = await handler.execute(
      new RevokeApiKeyCommand(apiKey.id.value, applicationId.value),
    );

    expect(result.isFailure).toBe(false);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0].status).toBe(ApiKeyStatus.REVOKED);
  });

  it('falha ao tentar revogar uma chave de outra application (evita IDOR entre applications)', async () => {
    const ownerApplicationId = UniqueId.create();
    const attackerApplicationId = UniqueId.create();
    const apiKey = ApiKey.create({
      applicationId: ownerApplicationId,
      hash: 'hash',
      prefix: 'mh_',
    });
    const repository = new FakeApiKeyRepository([apiKey]);
    const handler = new RevokeApiKeyHandler(repository);

    const result = await handler.execute(
      new RevokeApiKeyCommand(apiKey.id.value, attackerApplicationId.value),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ApiKeyNotFoundError);
    expect(repository.saved).toHaveLength(0);
    expect(apiKey.status).toBe(ApiKeyStatus.ACTIVE);
  });

  it('falha quando o apiKeyId não existe', async () => {
    const repository = new FakeApiKeyRepository([]);
    const handler = new RevokeApiKeyHandler(repository);

    const result = await handler.execute(
      new RevokeApiKeyCommand(UniqueId.create().value, UniqueId.create().value),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ApiKeyNotFoundError);
  });
});
