import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateTenantCommand } from '../../application/commands/create-tenant.command';
import { GetTenantQuery } from '../../application/queries/get-tenant.query';
import { CreateTenantRequestDto } from '../dto/create-tenant-request.dto';
import { TenantResponseDto } from '../dto/tenant-response.dto';

@ApiTags('tenants')
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
