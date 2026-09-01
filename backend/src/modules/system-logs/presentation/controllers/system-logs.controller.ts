import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import {
  SystemLogLevel,
  SystemLogSortField,
} from '../../application/ports/system-log.repository.interface';
import { ListSystemLogsQuery } from '../../application/queries/list-system-logs.query';
import { SystemLogResponseDto } from '../dto/system-log-response.dto';

const LOG_LEVELS: SystemLogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

class ListSystemLogsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: LOG_LEVELS })
  @IsOptional()
  @IsEnum(LOG_LEVELS)
  level?: SystemLogLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtra logs ocorridos a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra logs ocorridos até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: SystemLogSortField,
    description: 'Campo de ordenação (padrão: occurredAt).',
  })
  @IsOptional()
  @IsEnum(SystemLogSortField)
  sortBy?: SystemLogSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('system-logs')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/system-logs')
export class SystemLogsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  @ApiPaginatedResponse(SystemLogResponseDto)
  async list(
    @Query() query: ListSystemLogsRequestDto,
  ): Promise<PaginatedResult<SystemLogResponseDto>> {
    const result = await this.mediator.query(
      new ListSystemLogsQuery(
        query.page,
        query.pageSize,
        query.level,
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
      items: result.value.items.map((log) => SystemLogResponseDto.fromDto(log)),
    };
  }
}
