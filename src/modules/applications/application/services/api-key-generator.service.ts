import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UniqueId } from '@shared/domain';

export interface GeneratedApiKey {
  plainTextKey: string;
  prefix: string;
  hash: string;
}

export interface ParsedApiKey {
  apiKeyId: string;
  secret: string;
}

/** Gera, analisa e verifica tokens `wh_live_<apiKeyId>.<secret>` (secret nunca persistido em texto puro). */
@Injectable()
export class ApiKeyGeneratorService {
  private static readonly KEY_PREFIX = 'wh_live_';
  private static readonly SALT_ROUNDS = 10;

  async generate(apiKeyId: UniqueId): Promise<GeneratedApiKey> {
    const secret = randomBytes(24).toString('hex');
    const plainTextKey = `${ApiKeyGeneratorService.KEY_PREFIX}${apiKeyId.value}.${secret}`;
    const hash = await bcrypt.hash(secret, ApiKeyGeneratorService.SALT_ROUNDS);
    const prefix = `${ApiKeyGeneratorService.KEY_PREFIX}${apiKeyId.value.slice(0, 8)}`;

    return { plainTextKey, prefix, hash };
  }

  parse(plainTextKey: string): ParsedApiKey | null {
    if (!plainTextKey.startsWith(ApiKeyGeneratorService.KEY_PREFIX)) {
      return null;
    }

    const rest = plainTextKey.slice(ApiKeyGeneratorService.KEY_PREFIX.length);
    const [apiKeyId, secret] = rest.split('.');
    if (!apiKeyId || !secret) {
      return null;
    }

    return { apiKeyId, secret };
  }

  verify(secret: string, hash: string): Promise<boolean> {
    return bcrypt.compare(secret, hash);
  }
}
