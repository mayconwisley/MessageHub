import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('app.port', { infer: true }) as number;
  }

  get nodeEnv(): string {
    return this.configService.get<string>('app.nodeEnv', { infer: true }) as string;
  }

  get logLevel(): string {
    return this.configService.get<string>('app.logLevel', { infer: true }) as string;
  }

  get databaseUrl(): string {
    return this.configService.get<string>('database.url', { infer: true }) as string;
  }

  get initialPlatformAdminEmail(): string {
    return this.configService.get<string>('app.initialPlatformAdminEmail', {
      infer: true,
    }) as string;
  }

  get initialPlatformAdminPassword(): string {
    return this.configService.get<string>('app.initialPlatformAdminPassword', {
      infer: true,
    }) as string;
  }

  get corsOrigins(): string[] {
    return this.configService.get('app.corsOrigins') as string[];
  }

  get swaggerEnabled(): boolean {
    return this.configService.get<boolean>('app.swaggerEnabled', { infer: true }) as boolean;
  }

  get trustProxy(): boolean {
    return this.configService.get<boolean>('app.trustProxy', { infer: true }) as boolean;
  }

  get messageProvider(): 'meta' | 'sandbox' {
    return this.configService.get<'meta' | 'sandbox'>('app.messageProvider', { infer: true }) as
      'meta' | 'sandbox';
  }

  get sandboxEnabled(): boolean {
    return this.configService.get<boolean>('app.sandboxEnabled', { infer: true }) as boolean;
  }
  get slackWebhookUrl(): string | undefined {
    return this.configService.get<string>('app.slackWebhookUrl', { infer: true });
  }
  get teamsWebhookUrl(): string | undefined {
    return this.configService.get<string>('app.teamsWebhookUrl', { infer: true });
  }
  get emailWebhookUrl(): string | undefined {
    return this.configService.get<string>('app.emailWebhookUrl', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
