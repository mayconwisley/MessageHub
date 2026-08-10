import { UniqueId } from '@shared/domain';
import { ApiKey } from '@modules/applications/domain/entities/api-key.entity';
import { ApiKeyStatus } from '@modules/applications/domain/enums/api-key-status.enum';

describe('ApiKey', () => {
  it('starts ACTIVE and valid', () => {
    const apiKey = ApiKey.create({
      applicationId: UniqueId.create(),
      hash: 'hashed-secret',
      prefix: 'wh_live_abcd1234',
    });

    expect(apiKey.status).toBe(ApiKeyStatus.ACTIVE);
    expect(apiKey.isValid()).toBe(true);
  });

  it('becomes invalid after revoke', () => {
    const apiKey = ApiKey.create({
      applicationId: UniqueId.create(),
      hash: 'hashed-secret',
      prefix: 'wh_live_abcd1234',
    });

    apiKey.revoke();

    expect(apiKey.status).toBe(ApiKeyStatus.REVOKED);
    expect(apiKey.isValid()).toBe(false);
  });

  it('is invalid once past its expiration date', () => {
    const apiKey = ApiKey.create({
      applicationId: UniqueId.create(),
      hash: 'hashed-secret',
      prefix: 'wh_live_abcd1234',
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    });

    expect(apiKey.isValid(new Date('2020-06-01T00:00:00Z'))).toBe(false);
  });
});
