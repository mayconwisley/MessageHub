import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiKeyDto, CreatedApiKeyDto } from '../../application/dto/api-key.dto';

export class ApiKeyResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  prefix!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  expiresAt!: Date | null;

  @ApiProperty({ type: [String] })
  scopes!: string[];

  @ApiPropertyOptional()
  lastUsedAt!: Date | null;

  @ApiPropertyOptional()
  lastUsedIp!: string | null;

  static fromDto(dto: ApiKeyDto): ApiKeyResponseDto {
    const response = new ApiKeyResponseDto();
    response.id = dto.id;
    response.applicationId = dto.applicationId;
    response.prefix = dto.prefix;
    response.status = dto.status;
    response.type = dto.type;
    response.createdAt = dto.createdAt;
    response.expiresAt = dto.expiresAt;
    response.scopes = dto.scopes;
    response.lastUsedAt = dto.lastUsedAt;
    response.lastUsedIp = dto.lastUsedIp;
    return response;
  }
}

export class CreatedApiKeyResponseDto extends ApiKeyResponseDto {
  @ApiProperty({
    description: 'Chave em texto puro, exibida apenas nesta resposta. Nao e recuperavel depois.',
  })
  plainTextKey!: string;

  static override fromDto(dto: CreatedApiKeyDto): CreatedApiKeyResponseDto {
    const response = new CreatedApiKeyResponseDto();
    response.id = dto.id;
    response.applicationId = dto.applicationId;
    response.prefix = dto.prefix;
    response.status = dto.status;
    response.type = dto.type;
    response.createdAt = dto.createdAt;
    response.expiresAt = dto.expiresAt;
    response.scopes = dto.scopes;
    response.lastUsedAt = dto.lastUsedAt;
    response.lastUsedIp = dto.lastUsedIp;
    response.plainTextKey = dto.plainTextKey;
    return response;
  }
}
