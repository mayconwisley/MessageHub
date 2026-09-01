import {
  Controller,
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
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { ReprocessWebhookEventCommand } from '../../application/commands/reprocess-webhook-event.command';
import { ListWebhookEventsQuery } from '../../application/queries/list-webhook-events.query';
import { WebhookEventSortField } from '../../application/ports/webhook-event-operations.repository.interface';
import { WebhookEventResponseDto } from '../dto/webhook-event-response.dto';

class ListWebhookEventsRequestDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;

  @ApiPropertyOptional({ description: 'Filtra eventos recebidos a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra eventos recebidos até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: WebhookEventSortField,
    description: 'Campo de ordenação (padrão: receivedAt).',
  })
  @IsOptional()
  @IsEnum(WebhookEventSortField)
  sortBy?: WebhookEventSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('webhooks-operational')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/webhook-events')
export class WebhookEventsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  @ApiPaginatedResponse(WebhookEventResponseDto)
  async list(
    @Query() query: ListWebhookEventsRequestDto,
  ): Promise<PaginatedResult<WebhookEventResponseDto>> {
    const result = await this.mediator.query(
      new ListWebhookEventsQuery(
        query.page,
        query.pageSize,
        query.status,
        query.createdFrom ? new Date(query.createdFrom) : undefined,
        query.createdTo ? new Date(query.createdTo) : undefined,
        query.sortBy,
        query.sortDirection,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((item) => WebhookEventResponseDto.fromEntity(item)),
    };
  }

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocess(@Param('id', ParseUUIDPipe) id: string): Promise<WebhookEventResponseDto> {
    const result = await this.mediator.send(new ReprocessWebhookEventCommand(id));
    if (result.isFailure) throw toHttpException(result.error);
    return WebhookEventResponseDto.fromEntity(result.value);
  }
}
