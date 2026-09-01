import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { CreateApiKeyCommand } from '../../application/commands/create-api-key.command';
import { ListApiKeysQuery } from '../../application/queries/list-api-keys.query';
import { RevokeApiKeyCommand } from '../../application/commands/revoke-api-key.command';
import { ApiKeyResponseDto, CreatedApiKeyResponseDto } from '../dto/api-key-response.dto';
import { CreateApiKeyRequestDto } from '../dto/create-api-key-request.dto';
import { ApiKeyStatus } from '../../domain/enums/api-key-status.enum';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';
import { ApiKeySortField } from '../../domain/repositories/api-key.repository.interface';

class ListApiKeysRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ApiKeyStatus })
  @IsOptional()
  @IsEnum(ApiKeyStatus)
  status?: ApiKeyStatus;

  @ApiPropertyOptional({ description: 'Busca pelo prefixo público da chave.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filtra chaves criadas a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra chaves criadas até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: ApiKeySortField,
    description: 'Campo de ordenação (padrão: createdAt).',
  })
  @IsOptional()
  @IsEnum(ApiKeySortField)
  sortBy?: ApiKeySortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('api-keys')
@ApiHeader({ name: 'Authorization', required: true })
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/applications/:applicationId/api-keys')
export class ApiKeysController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatedApiKeyResponseDto })
  async create(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateApiKeyRequestDto,
  ): Promise<CreatedApiKeyResponseDto> {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const result = await this.mediator.send(
      new CreateApiKeyCommand(
        applicationId,
        expiresAt,
        dto.type ?? ApiKeyType.PLATFORM,
        dto.scopes,
      ),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return CreatedApiKeyResponseDto.fromDto(result.value);
  }

  @Get()
  @ApiPaginatedResponse(ApiKeyResponseDto)
  async list(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Query() query: ListApiKeysRequestDto,
  ): Promise<PaginatedResult<ApiKeyResponseDto>> {
    const result = await this.mediator.query(
      new ListApiKeysQuery(
        applicationId,
        query.page,
        query.pageSize,
        query.status,
        query.search,
        query.createdFrom ? new Date(query.createdFrom) : undefined,
        query.createdTo ? new Date(query.createdTo) : undefined,
        query.sortBy,
        query.sortDirection,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((apiKey) => ApiKeyResponseDto.fromDto(apiKey)),
    };
  }

  @Delete(':apiKeyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('apiKeyId', ParseUUIDPipe) apiKeyId: string,
  ): Promise<void> {
    const result = await this.mediator.send(new RevokeApiKeyCommand(apiKeyId, applicationId));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
  }
}
