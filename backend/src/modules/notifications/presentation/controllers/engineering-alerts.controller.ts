import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import {
  EngineeringAlertSeverity,
  EngineeringAlertSortField,
} from '../../application/ports/engineering-alert.repository.interface';
import { ListEngineeringAlertsQuery } from '../../application/queries/list-engineering-alerts.query';
import { EngineeringAlertResponseDto } from '../dto/engineering-alert-response.dto';

class ListEngineeringAlertsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['WARNING', 'CRITICAL'] })
  @IsOptional()
  @IsEnum(['WARNING', 'CRITICAL'])
  severity?: EngineeringAlertSeverity;

  @ApiPropertyOptional({ description: 'Filtra alertas ocorridos a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra alertas ocorridos até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: EngineeringAlertSortField,
    description: 'Campo de ordenação (padrão: occurredAt).',
  })
  @IsOptional()
  @IsEnum(EngineeringAlertSortField)
  sortBy?: EngineeringAlertSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('engineering-alerts')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/engineering-alerts')
export class EngineeringAlertsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}
  @Get()
  @ApiPaginatedResponse(EngineeringAlertResponseDto)
  async list(
    @Query() query: ListEngineeringAlertsRequestDto,
  ): Promise<PaginatedResult<EngineeringAlertResponseDto>> {
    const result = await this.mediator.query(
      new ListEngineeringAlertsQuery(
        query.page,
        query.pageSize,
        query.severity,
        query.createdFrom ? new Date(query.createdFrom) : undefined,
        query.createdTo ? new Date(query.createdTo) : undefined,
        query.sortBy,
        query.sortDirection,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((alert) => EngineeringAlertResponseDto.fromDto(alert)),
    };
  }
}
