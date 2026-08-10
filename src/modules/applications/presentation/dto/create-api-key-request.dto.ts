import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CreateApiKeyRequestDto {
  @ApiPropertyOptional({
    description: 'Data de expiracao (ISO 8601). Omitir para chave sem expiracao.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
