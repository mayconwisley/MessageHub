import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { IDEMPOTENCY_KEY_HEADER } from '@shared/constants';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { resolveRequiredApplicationId } from '@presentation/http/auth-scope.resolver';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { SendMessageCommand } from '../../application/commands/send-message.command';
import { GetMessageQuery } from '../../application/queries/get-message.query';
import { ListMessagesQuery } from '../../application/queries/list-messages.query';
import { ListMessageAttemptsQuery } from '../../application/queries/list-message-attempts.query';
import { ListMessageTimelineQuery } from '../../application/queries/list-message-timeline.query';
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

  @ApiPropertyOptional({
    description:
      'Busca por messageId, providerMessageId, requestId, Idempotency-Key ou destinatário.',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

class ApplicationScopedQueryDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

function resolveRequestingTenantId(user: AuthenticatedUserDto | undefined): string | undefined {
  return user?.role === UserRole.TENANT_ADMIN ? (user.tenantId ?? undefined) : undefined;
}

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrApiKeyGuard)
@Controller('v1/messages')
export class MessagesController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: MessageResponseDto })
  async send(
    @Body() dto: SendMessageRequestDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
    @Req() request?: Request & { id?: string },
  ): Promise<MessageResponseDto> {
    const applicationId = resolveRequiredApplicationId(authContext, dto.applicationId);
    const result = await this.mediator.send(
      new SendMessageCommand(
        applicationId,
        dto.phoneNumberId,
        dto.to,
        dto.content,
        idempotencyKey,
        request?.id,
        resolveRequestingTenantId(user),
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
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
    @Req() request?: Request & { id?: string },
  ): Promise<MessageResponseDto> {
    const applicationId = resolveRequiredApplicationId(authContext, dto.applicationId);
    const result = await this.mediator.send(
      new SendTemplateMessageCommand(
        applicationId,
        dto.phoneNumberId,
        dto.to,
        { id: dto.templateId, name: dto.templateName },
        dto.parameters ?? [],
        idempotencyKey,
        request?.id,
        resolveRequestingTenantId(user),
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return MessageResponseDto.fromDto(result.value);
  }

  @Get()
  async list(
    @Query() query: ListMessagesRequestDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PaginatedResult<MessageResponseDto>> {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new ListMessagesQuery(
        applicationId,
        query.page,
        query.pageSize,
        query.status,
        query.search,
        resolveRequestingTenantId(user),
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((message) => MessageResponseDto.fromDto(message)),
    };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ApplicationScopedQueryDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<MessageResponseDto> {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new GetMessageQuery(id, applicationId, resolveRequestingTenantId(user)),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return MessageResponseDto.fromDto(result.value);
  }

  @Get(':id/attempts')
  @ApiResponse({ status: HttpStatus.OK, type: [MessageAttemptResponseDto] })
  async listAttempts(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ApplicationScopedQueryDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<MessageAttemptResponseDto[]> {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new ListMessageAttemptsQuery(id, applicationId, resolveRequestingTenantId(user)),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((attempt) => MessageAttemptResponseDto.fromDto(attempt));
  }

  @Get(':id/timeline')
  async listTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ApplicationScopedQueryDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ) {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new ListMessageTimelineQuery(id, applicationId, resolveRequestingTenantId(user)),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }
}
