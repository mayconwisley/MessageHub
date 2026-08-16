import { plainToInstance } from 'class-transformer';
import {
  IsBase64,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  RABBITMQ_URL!: string;

  @IsOptional()
  @IsString()
  META_GRAPH_API_URL_BASE?: string;

  @IsOptional()
  @IsString()
  META_WEBHOOK_VERIFY_TOKEN?: string;

  @IsOptional()
  @IsString()
  META_APP_SECRET?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  META_DEFAULT_CHANNEL_ENABLED?: string;

  @IsOptional()
  @IsUUID()
  META_DEFAULT_CHANNEL_TENANT_ID?: string;

  @IsOptional()
  @IsString()
  META_DEFAULT_CHANNEL_TENANT_NAME?: string;

  @IsOptional()
  @IsString()
  META_DEFAULT_CHANNEL_APPLICATION_NAME?: string;

  @IsOptional()
  @IsString()
  META_DEFAULT_CHANNEL_WABA_ID?: string;

  @IsOptional()
  @IsString()
  META_DEFAULT_CHANNEL_BEARER?: string;

  @IsOptional()
  @IsString()
  META_DEFAULT_CHANNEL_PHONE_NUMBER_ID?: string;

  @IsBase64()
  META_CREDENTIALS_ENCRYPTION_KEY!: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SMTP_DEFAULT_ENABLED?: string;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT?: number;

  @IsOptional()
  @IsIn(['true', 'false'])
  SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  @IsOptional()
  @IsEmail()
  SMTP_FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM_NAME?: string;

  @IsEmail()
  INITIAL_PLATFORM_ADMIN_EMAIL!: string;

  @IsString()
  @MinLength(12)
  INITIAL_PLATFORM_ADMIN_PASSWORD!: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SWAGGER_ENABLED?: string;

  @IsOptional()
  @IsIn(['meta', 'sandbox'])
  MESSAGE_PROVIDER?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SANDBOX_ENABLED?: string;

  @IsOptional()
  @IsString()
  ENGINEERING_SLACK_WEBHOOK_URL?: string;
  @IsOptional()
  @IsString()
  ENGINEERING_TEAMS_WEBHOOK_URL?: string;
  @IsOptional()
  @IsString()
  ENGINEERING_EMAIL_WEBHOOK_URL?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Configuracao de ambiente invalida: ${errors.toString()}`);
  }

  if (Buffer.from(validatedConfig.META_CREDENTIALS_ENCRYPTION_KEY, 'base64').length !== 32) {
    throw new Error('META_CREDENTIALS_ENCRYPTION_KEY deve conter exatamente 32 bytes em Base64.');
  }

  const corsOrigins = (validatedConfig.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  for (const origin of corsOrigins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(
        'CORS_ORIGINS deve conter apenas origins HTTP(S) válidos, separados por vírgula.',
      );
    }
    if (
      parsed.origin !== origin ||
      !['http:', 'https:'].includes(parsed.protocol) ||
      (validatedConfig.NODE_ENV === 'production' && parsed.protocol !== 'https:') ||
      origin === '*'
    ) {
      throw new Error(
        'CORS_ORIGINS deve conter origins HTTP(S) exatos; em produção somente HTTPS é permitido, sem curingas ou caminhos.',
      );
    }
  }

  if (validatedConfig.NODE_ENV === 'production' && validatedConfig.SWAGGER_ENABLED === 'true') {
    throw new Error('SWAGGER_ENABLED não pode ser true em produção.');
  }

  for (const endpoint of [
    validatedConfig.ENGINEERING_SLACK_WEBHOOK_URL,
    validatedConfig.ENGINEERING_TEAMS_WEBHOOK_URL,
    validatedConfig.ENGINEERING_EMAIL_WEBHOOK_URL,
  ]) {
    if (!endpoint) continue;
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new Error('URLs de notificação de engenharia devem ser HTTP(S) válidas.');
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      (validatedConfig.NODE_ENV === 'production' && url.protocol !== 'https:')
    ) {
      throw new Error('Em produção, URLs de notificação de engenharia devem usar HTTPS.');
    }
  }

  if (
    validatedConfig.META_DEFAULT_CHANNEL_ENABLED === 'true' &&
    (!validatedConfig.META_GRAPH_API_URL_BASE ||
      !validatedConfig.META_DEFAULT_CHANNEL_BEARER ||
      !validatedConfig.META_DEFAULT_CHANNEL_TENANT_ID ||
      !validatedConfig.META_DEFAULT_CHANNEL_TENANT_NAME ||
      !validatedConfig.META_DEFAULT_CHANNEL_WABA_ID)
  ) {
    throw new Error(
      'META_GRAPH_API_URL_BASE, META_DEFAULT_CHANNEL_BEARER, META_DEFAULT_CHANNEL_TENANT_ID, META_DEFAULT_CHANNEL_TENANT_NAME e META_DEFAULT_CHANNEL_WABA_ID sao obrigatorios quando o canal Meta padrao estiver habilitado.',
    );
  }

  if (
    validatedConfig.SMTP_DEFAULT_ENABLED === 'true' &&
    (!validatedConfig.SMTP_HOST ||
      !validatedConfig.SMTP_USER ||
      !validatedConfig.SMTP_PASSWORD ||
      !validatedConfig.SMTP_FROM_EMAIL)
  ) {
    throw new Error(
      'SMTP_HOST, SMTP_USER, SMTP_PASSWORD e SMTP_FROM_EMAIL sao obrigatorios quando o SMTP padrao estiver habilitado.',
    );
  }

  return validatedConfig;
}
