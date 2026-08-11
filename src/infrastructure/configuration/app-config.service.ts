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

  get initialPlatformAdminEmail(): string {
    return this.configService.get<string>('app.initialPlatformAdminEmail', { infer: true }) as string;
  }

  get initialPlatformAdminPassword(): string {
    return this.configService.get<string>('app.initialPlatformAdminPassword', { infer: true }) as string;
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
