import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateTenantCommand } from '../../application/commands/create-tenant.command';
import { UpdateTenantStatusCommand } from '../../application/commands/update-tenant-status.command';
import { GetTenantQuery } from '../../application/queries/get-tenant.query';
import { CreateTenantRequestDto } from '../dto/create-tenant-request.dto';
import { UpdateTenantStatusRequestDto } from '../dto/update-tenant-status-request.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ListTenantsQuery } from '../../application/queries/list-tenants.query';
import { PaginatedResult, SortDirection } from '@shared/types';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantSortField } from '../../domain/repositories/tenant.repository.interface';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';

class ListTenantsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TenantStatus })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiPropertyOptional({ description: 'Filtra tenants cujo nome contenha este texto.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filtra tenants criados a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra tenants criados até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: TenantSortField,
    description: 'Campo de ordenação (padrão: createdAt).',
  })
  @IsOptional()
  @IsEnum(TenantSortField)
  sortBy?: TenantSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('tenants')
@ApiHeader({ name: 'Authorization', required: true })
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/tenants')
export class TenantsController {
  constructor(
    @Inject(MEDIATOR) private readonly mediator: IMediator,
    private readonly metaConfig: MetaConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: TenantResponseDto })
  async create(@Body() dto: CreateTenantRequestDto): Promise<TenantResponseDto> {
    const result = await this.mediator.send(new CreateTenantCommand(dto.name));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return TenantResponseDto.fromDto(result.value);
  }

  @Get()
  @ApiPaginatedResponse(TenantResponseDto)
  async list(@Query() query: ListTenantsRequestDto): Promise<PaginatedResult<TenantResponseDto>> {
    const result = await this.mediator.query(
      new ListTenantsQuery(
        query.page,
        query.pageSize,
        query.status,
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
      items: result.value.items.map((tenant) => TenantResponseDto.fromDto(tenant)),
    };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<TenantResponseDto> {
    const result = await this.mediator.query(new GetTenantQuery(id));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return TenantResponseDto.fromDto(result.value);
  }

  @Patch(':id/status')
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantStatusRequestDto,
  ): Promise<TenantResponseDto> {
    if (this.metaConfig.defaultChannelEnabled && id === this.metaConfig.defaultTenantId) {
      throw new ForbiddenException(
        'O tenant do canal padrão é gerenciado exclusivamente pelas variáveis de ambiente.',
      );
    }
    const result = await this.mediator.send(new UpdateTenantStatusCommand(id, dto.status));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return TenantResponseDto.fromDto(result.value);
  }
}
