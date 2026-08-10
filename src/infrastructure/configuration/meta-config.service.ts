import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetaConfigService {
  constructor(private readonly configService: ConfigService) {}

  get baseUrl(): string {
    return this.configService.get<string>('meta.baseUrl', { infer: true }) as string;
  }

  get apiVersion(): string {
    return this.configService.get<string>('meta.apiVersion', { infer: true }) as string;
  }

  get graphApiUrl(): string {
    return `${this.baseUrl}/${this.apiVersion}`;
  }
}
