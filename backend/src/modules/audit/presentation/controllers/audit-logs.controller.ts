import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult } from '@shared/types';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { ListAuditLogsQuery } from '../../application/queries/list-audit-logs.query';
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
}

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/audit-logs')
export class AuditLogsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  async list(
    @Query() query: ListAuditLogsRequestDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    const result = await this.mediator.query(
      new ListAuditLogsQuery(query.page, query.pageSize, query.resourceType, query.httpMethod),
    );
    return {
      ...result,
      items: result.items.map((log) => AuditLogResponseDto.fromDto(log)),
    };
  }
}
