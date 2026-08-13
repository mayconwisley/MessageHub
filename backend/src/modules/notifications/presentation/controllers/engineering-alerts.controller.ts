import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { EngineeringAlertSeverity } from '../../application/ports/engineering-alert.repository.interface';
import { ListEngineeringAlertsQuery } from '../../application/queries/list-engineering-alerts.query';
import { EngineeringAlertResponseDto } from '../dto/engineering-alert-response.dto';

class ListEngineeringAlertsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ['WARNING', 'CRITICAL'] })
  @IsOptional()
  @IsEnum(['WARNING', 'CRITICAL'])
  severity?: EngineeringAlertSeverity;
}

@ApiTags('engineering-alerts')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/engineering-alerts')
export class EngineeringAlertsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}
  @Get()
  async list(
    @Query() query: ListEngineeringAlertsRequestDto,
  ): Promise<PaginatedResult<EngineeringAlertResponseDto>> {
    const result = await this.mediator.query(
      new ListEngineeringAlertsQuery(query.page, query.pageSize, query.severity),
    );
    return {
      ...result,
      items: result.items.map((alert) => EngineeringAlertResponseDto.fromDto(alert)),
    };
  }
}
