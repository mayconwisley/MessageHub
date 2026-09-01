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
import { ListAuditLogsQuery } from '../../application/queries/list-audit-logs.query';
import { AuditLogSortField } from '../../application/ports/audit-log.repository.interface';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

class ListAuditLogsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  httpMethod?: string;

  @ApiPropertyOptional({ description: 'Filtra eventos ocorridos a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra eventos ocorridos até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: AuditLogSortField,
    description: 'Campo de ordenação (padrão: occurredAt).',
  })
  @IsOptional()
  @IsEnum(AuditLogSortField)
  sortBy?: AuditLogSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/audit-logs')
export class AuditLogsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  @ApiPaginatedResponse(AuditLogResponseDto)
  async list(
    @Query() query: ListAuditLogsRequestDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    const result = await this.mediator.query(
      new ListAuditLogsQuery(
        query.page,
        query.pageSize,
        query.resourceType,
        query.httpMethod,
        query.createdFrom ? new Date(query.createdFrom) : undefined,
        query.createdTo ? new Date(query.createdTo) : undefined,
        query.sortBy,
        query.sortDirection,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((log) => AuditLogResponseDto.fromDto(log)),
    };
  }
}
