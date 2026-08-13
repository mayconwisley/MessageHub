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

  @IsEmail()
  INITIAL_PLATFORM_ADMIN_EMAIL!: string;

  @IsString()
  @MinLength(12)
  INITIAL_PLATFORM_ADMIN_PASSWORD!: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
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

  return validatedConfig;
}
