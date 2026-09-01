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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { IDEMPOTENCY_KEY_HEADER } from '@shared/constants';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { resolveRequiredApplicationId } from '@presentation/http/auth-scope.resolver';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { SendEmailCommand } from '../../application/commands/send-email.command';
import { ListEmailsQuery } from '../../application/queries/list-emails.query';
import { ListEmailTimelineQuery } from '../../application/queries/list-email-timeline.query';
import { EmailStatus } from '../../domain/enums/email-status.enum';
import { EmailSortField } from '../../domain/repositories/email-message.repository.interface';
import { EmailMessageResponseDto } from '../dto/email-message-response.dto';
import { EmailTimelineEventResponseDto } from '../dto/email-timeline-event-response.dto';
import { SendEmailRequestDto } from '../dto/send-email-request.dto';

class ApplicationScopedQueryDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

class ListEmailsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EmailStatus })
  @IsOptional()
  @IsEnum(EmailStatus)
  status?: EmailStatus;

  @ApiPropertyOptional({
    description:
      'Busca por e-mail ID, provider ID, request ID, Idempotency-Key, assunto ou destinatário.',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Filtra e-mails criados a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra e-mails criados até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: EmailSortField,
    description: 'Campo de ordenação (padrão: createdAt).',
  })
  @IsOptional()
  @IsEnum(EmailSortField)
  sortBy?: EmailSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

function resolveRequestingTenantId(user: AuthenticatedUserDto | undefined): string | undefined {
  return user?.role === UserRole.TENANT_ADMIN ? (user.tenantId ?? undefined) : undefined;
}

@ApiTags('emails')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrApiKeyGuard)
@Controller('v1/emails')
export class EmailsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Envia um e-mail',
    description:
      'Enfileira um e-mail para envio via SMTP configurado para o tenant/aplicação. ' +
      'Se um `Idempotency-Key` já processado for reenviado, retorna o e-mail existente sem duplicar o envio.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'E-mail aceito para envio.',
    type: EmailMessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos (ex: destinatário inválido ou nenhum corpo informado).',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Aplicação informada não foi encontrada.',
  })
  async send(
    @Body() dto: SendEmailRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
    @Req() request?: Request & { id?: string },
  ): Promise<EmailMessageResponseDto> {
    const result = await this.mediator.send(
      new SendEmailCommand(
        resolveRequiredApplicationId(auth, dto.applicationId),
        dto.to,
        dto.subject,
        dto.textBody,
        dto.htmlBody,
        idempotencyKey,
        request?.id,
        resolveRequestingTenantId(user),
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return EmailMessageResponseDto.fromDto(result.value);
  }

  @Get()
  @ApiOperation({ summary: 'Lista e-mails de uma aplicação' })
  @ApiPaginatedResponse(EmailMessageResponseDto)
  async list(
    @Query() query: ListEmailsRequestDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PaginatedResult<EmailMessageResponseDto>> {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new ListEmailsQuery(
        applicationId,
        query.page,
        query.pageSize,
        query.status,
        query.search,
        resolveRequestingTenantId(user),
        query.createdFrom ? new Date(query.createdFrom) : undefined,
        query.createdTo ? new Date(query.createdTo) : undefined,
        query.sortBy,
        query.sortDirection,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((email) => EmailMessageResponseDto.fromDto(email)),
    };
  }

  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Lista o histórico de eventos de um e-mail',
    description:
      'Retorna, em ordem cronológica, os eventos registrados durante o processamento do e-mail ' +
      '(tentativas de entrega, aceite pelo provedor, falhas, reagendamentos, envio para DLQ).',
  })
  @ApiParam({ name: 'id', description: 'ID do e-mail (EmailMessage).' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eventos do e-mail, do mais antigo para o mais recente.',
    type: EmailTimelineEventResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'E-mail não foi encontrado para a aplicação/tenant informado.',
  })
  async listTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ApplicationScopedQueryDto,
    @CurrentOptionalAuthContext() authContext?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<EmailTimelineEventResponseDto[]> {
    const applicationId = resolveRequiredApplicationId(authContext, query.applicationId);
    const result = await this.mediator.query(
      new ListEmailTimelineQuery(id, applicationId, resolveRequestingTenantId(user)),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((event) => EmailTimelineEventResponseDto.fromDto(event));
  }
}
