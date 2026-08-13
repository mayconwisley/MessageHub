import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { ReprocessWebhookEventCommand } from '../../application/commands/reprocess-webhook-event.command';
import { ListWebhookEventsQuery } from '../../application/queries/list-webhook-events.query';
import { WebhookEventResponseDto } from '../dto/webhook-event-response.dto';

class ListWebhookEventsRequestDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  status?: string;
}

@ApiTags('webhooks-operational')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/webhook-events')
export class WebhookEventsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  async list(
    @Query() query: ListWebhookEventsRequestDto,
  ): Promise<PaginatedResult<WebhookEventResponseDto>> {
    const result = await this.mediator.query(
      new ListWebhookEventsQuery(query.page, query.pageSize, query.status),
    );
    return {
      ...result,
      items: result.items.map((item) => WebhookEventResponseDto.fromEntity(item)),
    };
  }

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  async reprocess(@Param('id') id: string): Promise<WebhookEventResponseDto> {
    const result = await this.mediator.send(new ReprocessWebhookEventCommand(id));
    if (result.isFailure) throw toHttpException(result.error);
    return WebhookEventResponseDto.fromEntity(result.value);
  }
}
