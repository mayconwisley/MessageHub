import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IDEMPOTENCY_KEY_HEADER } from '@shared/constants';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { CurrentAuthContext } from '@presentation/http/decorators/current-auth-context.decorator';
import { ApiKeyAuthGuard } from '@presentation/http/guards/api-key-auth.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { SendMessageCommand } from '../../application/commands/send-message.command';
import { GetMessageQuery } from '../../application/queries/get-message.query';
import { ListMessagesQuery } from '../../application/queries/list-messages.query';
import { ListMessageAttemptsQuery } from '../../application/queries/list-message-attempts.query';
import { MessageStatus } from '../../domain/enums/message-status.enum';
import { MessageAttemptResponseDto, MessageResponseDto } from '../dto/message-response.dto';
import { SendMessageRequestDto } from '../dto/send-message-request.dto';
import { SendTemplateMessageRequestDto } from '../dto/send-template-message-request.dto';
import { SendTemplateMessageCommand } from '../../application/commands/send-template-message.command';

class ListMessagesRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MessageStatus })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(ApiKeyAuthGuard)
@Controller('v1/messages')
export class MessagesController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: MessageResponseDto })
  async send(
    @Body() dto: SendMessageRequestDto,
    @CurrentAuthContext() authContext: AuthContextDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
  ): Promise<MessageResponseDto> {
    const result = await this.mediator.send(
      new SendMessageCommand(
        authContext.applicationId,
        dto.phoneNumberId,
        dto.to,
        dto.content,
        idempotencyKey,
      ),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return MessageResponseDto.fromDto(result.value);
  }

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: MessageResponseDto })
  async sendTemplate(
    @Body() dto: SendTemplateMessageRequestDto,
    @CurrentAuthContext() authContext: AuthContextDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
  ): Promise<MessageResponseDto> {
    const result = await this.mediator.send(
      new SendTemplateMessageCommand(
        authContext.applicationId,
        dto.phoneNumberId,
        dto.to,
        { id: dto.templateId, name: dto.templateName },
        dto.parameters ?? [],
        idempotencyKey,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return MessageResponseDto.fromDto(result.value);
  }

  @Get()
  async list(
    @Query() query: ListMessagesRequestDto,
    @CurrentAuthContext() authContext: AuthContextDto,
  ): Promise<PaginatedResult<MessageResponseDto>> {
    const result = await this.mediator.query(
      new ListMessagesQuery(authContext.applicationId, query.page, query.pageSize, query.status),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return { ...result.value, items: result.value.items.map(MessageResponseDto.fromDto) };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  async getById(
    @Param('id') id: string,
    @CurrentAuthContext() authContext: AuthContextDto,
  ): Promise<MessageResponseDto> {
    const result = await this.mediator.query(new GetMessageQuery(id, authContext.applicationId));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return MessageResponseDto.fromDto(result.value);
  }

  @Get(':id/attempts')
  @ApiResponse({ status: HttpStatus.OK, type: [MessageAttemptResponseDto] })
  async listAttempts(
    @Param('id') id: string,
    @CurrentAuthContext() authContext: AuthContextDto,
  ): Promise<MessageAttemptResponseDto[]> {
    const result = await this.mediator.query(
      new ListMessageAttemptsQuery(id, authContext.applicationId),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map(MessageAttemptResponseDto.fromDto);
  }
}
