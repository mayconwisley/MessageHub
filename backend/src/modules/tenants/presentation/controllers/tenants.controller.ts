import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateTenantCommand } from '../../application/commands/create-tenant.command';
import { GetTenantQuery } from '../../application/queries/get-tenant.query';
import { CreateTenantRequestDto } from '../dto/create-tenant-request.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ListTenantsQuery } from '../../application/queries/list-tenants.query';
import { PaginatedResult } from '@shared/types';

@ApiTags('tenants')
@ApiHeader({ name: 'Authorization', required: true })
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/tenants')
export class TenantsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

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
  async list(@Query() query: PaginationQueryDto): Promise<PaginatedResult<TenantResponseDto>> {
    const result = await this.mediator.query(new ListTenantsQuery(query.page, query.pageSize));
    if (result.isFailure) throw new InternalServerErrorException();
    return { ...result.value, items: result.value.items.map(TenantResponseDto.fromDto) };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async getById(@Param('id') id: string): Promise<TenantResponseDto> {
    const result = await this.mediator.query(new GetTenantQuery(id));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return TenantResponseDto.fromDto(result.value);
  }
}
