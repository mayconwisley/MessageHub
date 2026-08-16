import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpConnectionSettings } from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';

/** Le a credencial SMTP global, que e o fallback para tenants sem configuracao propria. */
@Injectable()
export class SmtpConfigService {
  constructor(private readonly configService: ConfigService) {}

  get defaultSettings(): SmtpConnectionSettings | null {
    const enabled =
      this.configService.get<boolean>('smtp.defaultEnabled', { infer: true }) ?? false;
    if (!enabled) return null;

    const host = this.configService.get<string>('smtp.host', { infer: true });
    const user = this.configService.get<string>('smtp.user', { infer: true });
    const password = this.configService.get<string>('smtp.password', { infer: true });
    const fromEmail = this.configService.get<string>('smtp.fromEmail', { infer: true });
    if (!host || !user || !password || !fromEmail) return null;

    return {
      host,
      port: this.configService.get<number>('smtp.port', { infer: true }) ?? 587,
      secure: this.configService.get<boolean>('smtp.secure', { infer: true }) ?? false,
      username: user,
      password,
      fromEmail,
      fromName:
        this.configService.get<string>('smtp.fromName', { infer: true })?.trim() || 'Message Hub',
    };
  }
}
