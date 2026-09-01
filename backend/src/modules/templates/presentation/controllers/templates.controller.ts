import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { resolveRequiredTenantId } from '@presentation/http/auth-scope.resolver';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { TemplateSortField } from '../../domain/repositories/template.repository.interface';
import { CreateTemplateCommand } from '../../application/commands/create-template.command';
import { DeleteTemplateCommand } from '../../application/commands/delete-template.command';
import { PublishPendingTemplatesCommand } from '../../application/commands/publish-pending-templates.command';
import { SyncTemplatesCommand } from '../../application/commands/sync-templates.command';
import { UpdateTemplateCommand } from '../../application/commands/update-template.command';
import { GetTemplateQuery } from '../../application/queries/get-template.query';
import { ListTemplatesQuery } from '../../application/queries/list-templates.query';
import { TemplateStatus } from '../../domain/enums/template-status.enum';
import { CreateTemplateRequestDto } from '../dto/create-template-request.dto';
import { TemplateResponseDto } from '../dto/template-response.dto';
import { PublishPendingTemplatesResponseDto } from '../dto/publish-pending-templates-response.dto';
import { SyncTemplatesResponseDto } from '../dto/sync-templates-response.dto';
import { UpdateTemplateRequestDto } from '../dto/update-template-request.dto';
import { WhatsAppAccountReferenceRequestDto } from '../dto/whatsapp-account-reference-request.dto';
import { TemplateRequestMapper } from '../mappers/template-request.mapper';

class ListTemplatesRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Conta WhatsApp à qual os templates pertencem.' })
  @IsUUID()
  whatsAppAccountId!: string;

  @ApiPropertyOptional({ description: 'Sincroniza os templates com a Meta antes da consulta.' })
  @IsOptional()
  @IsBooleanString()
  sync?: string;

  @ApiPropertyOptional({ enum: TemplateStatus })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Busca por nome do template.' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtra templates criados a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra templates criados até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: TemplateSortField,
    description: 'Campo de ordenação (padrão: createdAt).',
  })
  @IsOptional()
  @IsEnum(TemplateSortField)
  sortBy?: TemplateSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;

  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

class TenantScopedQueryDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

@ApiTags('templates')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrApiKeyGuard)
@Controller('v1/templates')
export class TemplatesController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, type: TemplateResponseDto })
  async create(
    @Body() dto: CreateTemplateRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<TemplateResponseDto> {
    const tenantId = resolveRequiredTenantId(auth, user, dto.tenantId);
    const result = await this.mediator.send(
      new CreateTemplateCommand(
        tenantId,
        dto.whatsAppAccountId,
        TemplateRequestMapper.toCreateDefinition(dto),
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Get()
  @ApiPaginatedResponse(TemplateResponseDto)
  async list(
    @Query() query: ListTemplatesRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PaginatedResult<TemplateResponseDto>> {
    const tenantId = resolveRequiredTenantId(auth, user, query.tenantId);
    const result = await this.mediator.query(
      new ListTemplatesQuery(
        tenantId,
        query.whatsAppAccountId,
        query.sync === 'true',
        query.page,
        query.pageSize,
        {
          status: query.status,
          category: query.category,
          search: query.search,
          createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
          createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
          sortBy: query.sortBy,
          sortDirection: query.sortDirection,
        },
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((template) => TemplateResponseDto.from(template)),
    };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TemplateResponseDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TenantScopedQueryDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<TemplateResponseDto> {
    const tenantId = resolveRequiredTenantId(auth, user, query.tenantId);
    const result = await this.mediator.query(new GetTemplateQuery(tenantId, id));
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: SyncTemplatesResponseDto })
  async sync(
    @Body() dto: WhatsAppAccountReferenceRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ) {
    const tenantId = resolveRequiredTenantId(auth, user, dto.tenantId);
    const result = await this.mediator.send(
      new SyncTemplatesCommand(tenantId, dto.whatsAppAccountId),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }

  @Post('publish-pending')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: PublishPendingTemplatesResponseDto })
  async publishPending(
    @Body() dto: WhatsAppAccountReferenceRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ) {
    const tenantId = resolveRequiredTenantId(auth, user, dto.tenantId);
    const result = await this.mediator.send(
      new PublishPendingTemplatesCommand(tenantId, dto.whatsAppAccountId),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }

  @Put(':id')
  @ApiResponse({ status: HttpStatus.OK, type: TemplateResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<TemplateResponseDto> {
    const tenantId = resolveRequiredTenantId(auth, user, dto.tenantId);
    const result = await this.mediator.send(
      new UpdateTemplateCommand(tenantId, id, TemplateRequestMapper.toUpdateDefinition(dto)),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return TemplateResponseDto.from(result.value);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: TenantScopedQueryDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<void> {
    const tenantId = resolveRequiredTenantId(auth, user, query.tenantId);
    const result = await this.mediator.send(new DeleteTemplateCommand(tenantId, id));
    if (result.isFailure) throw toHttpException(result.error);
  }
}
