import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UniqueId } from '@shared/domain';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';

export interface GeneratedApiKey {
  plainTextKey: string;
  prefix: string;
  hash: string;
}

export interface ParsedApiKey {
  apiKeyId: string;
  secret: string;
}

/** Gera, analisa e verifica tokens do Hub sem persistir o segredo em texto puro. */
@Injectable()
export class ApiKeyGeneratorService {
  private static readonly PLATFORM_KEY_PREFIX = 'wh_live_';
  private static readonly TENANT_KEY_PREFIX = 'wh_tenant_live_';
  private static readonly SALT_ROUNDS = 10;

  async generate(
    apiKeyId: UniqueId,
    type: ApiKeyType = ApiKeyType.PLATFORM,
  ): Promise<GeneratedApiKey> {
    const secret = randomBytes(24).toString('hex');
    const keyPrefix = this.getKeyPrefix(type);
    const plainTextKey = `${keyPrefix}${apiKeyId.value}.${secret}`;
    const hash = await bcrypt.hash(secret, ApiKeyGeneratorService.SALT_ROUNDS);
    const prefix = `${keyPrefix}${apiKeyId.value.slice(0, 8)}`;

    return { plainTextKey, prefix, hash };
  }

  parse(plainTextKey: string): ParsedApiKey | null {
    const keyPrefix = [
      ApiKeyGeneratorService.TENANT_KEY_PREFIX,
      ApiKeyGeneratorService.PLATFORM_KEY_PREFIX,
    ].find((prefix) => plainTextKey.startsWith(prefix));
    if (!keyPrefix) return null;
    const rest = plainTextKey.slice(keyPrefix.length);
    const [apiKeyId, secret] = rest.split('.');
    if (!apiKeyId || !secret) {
      return null;
    }

    return { apiKeyId, secret };
  }

  verify(secret: string, hash: string): Promise<boolean> {
    return bcrypt.compare(secret, hash);
  }

  private getKeyPrefix(type: ApiKeyType): string {
    return type === ApiKeyType.TENANT
      ? ApiKeyGeneratorService.TENANT_KEY_PREFIX
      : ApiKeyGeneratorService.PLATFORM_KEY_PREFIX;
  }
}
