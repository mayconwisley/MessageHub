import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';

export class CreateApiKeyRequestDto {
  @ApiPropertyOptional({
    description: 'Data de expiracao (ISO 8601). Omitir para chave sem expiracao.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    enum: ApiKeyType,
    default: ApiKeyType.PLATFORM,
    description: 'platform: envio e templates; tenant: também gerencia contas e números do próprio tenant.',
  })
  @IsOptional()
  @IsEnum(ApiKeyType)
  type?: ApiKeyType;
}
