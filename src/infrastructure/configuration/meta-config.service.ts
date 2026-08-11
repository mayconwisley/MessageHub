import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetaConfigService {
  constructor(private readonly configService: ConfigService) {}

  get graphApiUrl(): string | null {
    return (
      this.configService
        .get<string>('meta.graphApiUrlBase', { infer: true })
        ?.replace(/\/+$/, '') ?? null
    );
  }

  get defaultChannelEnabled(): boolean {
    return this.configService.get<boolean>('meta.defaultChannelEnabled', { infer: true }) ?? false;
  }

  get defaultAccessToken(): string | null {
    return this.configService.get<string>('meta.defaultAccessToken', { infer: true }) ?? null;
  }

  get credentialsEncryptionKey(): string {
    return this.configService.get<string>('meta.credentialsEncryptionKey', {
      infer: true,
    }) as string;
  }

  get webhookVerifyToken(): string | null {
    return this.configService.get<string>('meta.webhookVerifyToken', { infer: true }) ?? null;
  }

  get appSecret(): string | null {
    return this.configService.get<string>('meta.appSecret', { infer: true }) ?? null;
  }
}
