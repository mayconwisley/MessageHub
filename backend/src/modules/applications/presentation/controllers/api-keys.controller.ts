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
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { CreateApiKeyCommand } from '../../application/commands/create-api-key.command';
import { ListApiKeysQuery } from '../../application/queries/list-api-keys.query';
import { RevokeApiKeyCommand } from '../../application/commands/revoke-api-key.command';
import { ApiKeyResponseDto, CreatedApiKeyResponseDto } from '../dto/api-key-response.dto';
import { CreateApiKeyRequestDto } from '../dto/create-api-key-request.dto';
import { ApiKeyType } from '../../domain/enums/api-key-type.enum';

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
  async list(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<ApiKeyResponseDto>> {
    const result = await this.mediator.query(
      new ListApiKeysQuery(applicationId, query.page, query.pageSize),
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
