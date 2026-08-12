import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { CurrentAuthContext } from '@presentation/http/decorators/current-auth-context.decorator';
import { ApiKeyAuthGuard } from '@presentation/http/guards/api-key-auth.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { TemplateManagementService } from '../../application/services/template-management.service';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import { CreateTemplateRequestDto } from '../dto/create-template-request.dto';
import { TemplateResponseDto } from '../dto/template-response.dto';
import { PublishPendingTemplatesResponseDto } from '../dto/publish-pending-templates-response.dto';
import { SyncTemplatesResponseDto } from '../dto/sync-templates-response.dto';
import { UpdateTemplateRequestDto } from '../dto/update-template-request.dto';
import { WhatsAppAccountReferenceRequestDto } from '../dto/whatsapp-account-reference-request.dto';
import { TemplateRequestMapper } from '../mappers/template-request.mapper';

class ListTemplatesRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TemplateStatus })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(ApiKeyAuthGuard)
@Controller('v1/templates')
export class TemplatesController {
  constructor(private readonly templates: TemplateManagementService) {}

  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: TemplateResponseDto })
  async create(
    @Body() dto: CreateTemplateRequestDto,
    @CurrentAuthContext() auth: AuthContextDto,
  ): Promise<TemplateResponseDto> {
    const result = await this.templates.create(
      auth.tenantId,
      dto.whatsAppAccountId,
      TemplateRequestMapper.toCreateDefinition(dto),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: [TemplateResponseDto] })
  async list(
    @Query('whatsAppAccountId') accountId: string,
    @Query('sync') sync: string | undefined,
    @Query() query: ListTemplatesRequestDto,
    @CurrentAuthContext() auth: AuthContextDto,
  ): Promise<PaginatedResult<TemplateResponseDto>> {
    const result = await this.templates.list(
      auth.tenantId,
      accountId,
      sync === 'true',
      query.page,
      query.pageSize,
      { status: query.status, category: query.category },
    );
    if (result.isFailure) throw toHttpException(result.error);
    return { ...result.value, items: result.value.items.map((template) => TemplateResponseDto.from(template)) };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TemplateResponseDto })
  async getById(
    @Param('id') id: string,
    @CurrentAuthContext() auth: AuthContextDto,
  ): Promise<TemplateResponseDto> {
    const result = await this.templates.getById(auth.tenantId, id);
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: SyncTemplatesResponseDto })
  async sync(
    @Body() dto: WhatsAppAccountReferenceRequestDto,
    @CurrentAuthContext() auth: AuthContextDto,
  ) {
    const result = await this.templates.sync(auth.tenantId, dto.whatsAppAccountId);
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }

  @Post('publish-pending')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: PublishPendingTemplatesResponseDto })
  async publishPending(
    @Body() dto: WhatsAppAccountReferenceRequestDto,
    @CurrentAuthContext() auth: AuthContextDto,
  ) {
    const result = await this.templates.publishPending(auth.tenantId, dto.whatsAppAccountId);
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateRequestDto,
    @CurrentAuthContext() auth: AuthContextDto,
  ): Promise<TemplateResponseDto> {
    const result = await this.templates.update(
      auth.tenantId,
      id,
      TemplateRequestMapper.toUpdateDefinition(dto),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentAuthContext() auth: AuthContextDto): Promise<void> {
    const result = await this.templates.delete(auth.tenantId, id);
    if (result.isFailure) throw toHttpException(result.error);
  }
}
