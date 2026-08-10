import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateApiKeyCommand } from '../../application/commands/create-api-key.command';
import { RevokeApiKeyCommand } from '../../application/commands/revoke-api-key.command';
import { CreatedApiKeyResponseDto } from '../dto/api-key-response.dto';
import { CreateApiKeyRequestDto } from '../dto/create-api-key-request.dto';

@ApiTags('api-keys')
@Controller('v1/applications/:applicationId/api-keys')
export class ApiKeysController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: CreatedApiKeyResponseDto })
  async create(
    @Param('applicationId') applicationId: string,
    @Body() dto: CreateApiKeyRequestDto,
  ): Promise<CreatedApiKeyResponseDto> {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const result = await this.mediator.send(new CreateApiKeyCommand(applicationId, expiresAt));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return CreatedApiKeyResponseDto.fromDto(result.value);
  }

  @Delete(':apiKeyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('apiKeyId') apiKeyId: string): Promise<void> {
    const result = await this.mediator.send(new RevokeApiKeyCommand(apiKeyId));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
  }
}
