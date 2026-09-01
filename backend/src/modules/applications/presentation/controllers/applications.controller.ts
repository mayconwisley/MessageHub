import {
  BadRequestException,
  Body,
  Controller,
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
import { ApiHeader, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ApiPaginatedResponse } from '@presentation/http/decorators/api-paginated-response.decorator';
import { PaginatedResult, SortDirection } from '@shared/types';
import { ApplicationSortField } from '../../domain/repositories/application.repository.interface';
import { CreateApplicationCommand } from '../../application/commands/create-application.command';
import { ConfigureApplicationWebhookCommand } from '../../application/commands/configure-application-webhook.command';
import { ConfigureApplicationQuotasCommand } from '../../application/commands/configure-application-quotas.command';
import { SetApplicationPhoneNumbersCommand } from '../../application/commands/set-application-phone-numbers.command';
import { ListApplicationsQuery } from '../../application/queries/list-applications.query';
import { GetApplicationQuery } from '../../application/queries/get-application.query';
import { ListApplicationPhoneNumbersQuery } from '../../application/queries/list-application-phone-numbers.query';
import { ApplicationResponseDto } from '../dto/application-response.dto';
import { CreateApplicationRequestDto } from '../dto/create-application-request.dto';
import { ConfigureWebhookRequestDto } from '../dto/configure-webhook-request.dto';
import { WebhookConfigResponseDto } from '../dto/webhook-config-response.dto';
import { SetApplicationPhoneNumbersRequestDto } from '../dto/set-application-phone-numbers-request.dto';
import { LinkedPhoneNumberResponseDto } from '../dto/linked-phone-number-response.dto';
import { ConfigureApplicationQuotasRequestDto } from '../dto/configure-application-quotas-request.dto';
import { assertSafeWebhookUrl, assertWebhookUrlFormat } from '@shared/security';

class ListApplicationsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Busca por nome da aplicação.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filtra aplicações criadas a partir desta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filtra aplicações criadas até esta data (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({
    enum: ApplicationSortField,
    description: 'Campo de ordenação (padrão: createdAt).',
  })
  @IsOptional()
  @IsEnum(ApplicationSortField)
  sortBy?: ApplicationSortField;

  @ApiPropertyOptional({ enum: SortDirection, description: 'Direção da ordenação (padrão: DESC).' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}

@ApiTags('applications')
@ApiHeader({ name: 'Authorization', required: true })
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/applications')
export class ApplicationsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: ApplicationResponseDto })
  async create(@Body() dto: CreateApplicationRequestDto): Promise<ApplicationResponseDto> {
    const result = await this.mediator.send(new CreateApplicationCommand(dto.tenantId, dto.name));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return ApplicationResponseDto.fromDto(result.value);
  }

  @Get()
  @ApiPaginatedResponse(ApplicationResponseDto)
  async list(
    @Query() query: ListApplicationsRequestDto,
  ): Promise<PaginatedResult<ApplicationResponseDto>> {
    if (!query.tenantId) {
      throw new BadRequestException('tenantId é obrigatório.');
    }
    const result = await this.mediator.query(
      new ListApplicationsQuery(
        query.tenantId,
        query.page,
        query.pageSize,
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
      items: result.value.items.map((application) => ApplicationResponseDto.fromDto(application)),
    };
  }

  @Get(':applicationId')
  @ApiResponse({ status: HttpStatus.OK, type: ApplicationResponseDto })
  async getById(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<ApplicationResponseDto> {
    const result = await this.mediator.query(new GetApplicationQuery(applicationId));
    if (result.isFailure) throw toHttpException(result.error);
    return ApplicationResponseDto.fromDto(result.value);
  }

  @Put(':applicationId/webhook')
  @ApiResponse({ status: HttpStatus.OK, type: WebhookConfigResponseDto })
  async configureWebhook(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: ConfigureWebhookRequestDto,
  ): Promise<WebhookConfigResponseDto> {
    if (dto.webhookUrl) {
      try {
        assertWebhookUrlFormat(dto.webhookUrl);
        await assertSafeWebhookUrl(dto.webhookUrl);
      } catch {
        throw new BadRequestException(
          'webhookUrl deve usar HTTPS e apontar exclusivamente para um host público.',
        );
      }
    }
    const result = await this.mediator.send(
      new ConfigureApplicationWebhookCommand(applicationId, dto.webhookUrl ?? null),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return WebhookConfigResponseDto.fromDto(result.value);
  }

  @Put(':applicationId/quotas')
  @ApiResponse({ status: HttpStatus.OK, type: ApplicationResponseDto })
  async configureQuotas(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: ConfigureApplicationQuotasRequestDto,
  ): Promise<ApplicationResponseDto> {
    const result = await this.mediator.send(
      new ConfigureApplicationQuotasCommand(applicationId, dto.quotaPerMinute, dto.quotaPerDay),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return ApplicationResponseDto.fromDto(result.value);
  }

  @Get(':applicationId/phone-numbers')
  @ApiResponse({ status: HttpStatus.OK, type: [LinkedPhoneNumberResponseDto] })
  async listPhoneNumbers(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ): Promise<LinkedPhoneNumberResponseDto[]> {
    const result = await this.mediator.query(new ListApplicationPhoneNumbersQuery(applicationId));
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((dto) => LinkedPhoneNumberResponseDto.fromDto(dto));
  }

  @Put(':applicationId/phone-numbers')
  @ApiResponse({ status: HttpStatus.OK, type: [LinkedPhoneNumberResponseDto] })
  async setPhoneNumbers(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: SetApplicationPhoneNumbersRequestDto,
  ): Promise<LinkedPhoneNumberResponseDto[]> {
    const result = await this.mediator.send(
      new SetApplicationPhoneNumbersCommand(applicationId, dto.phoneNumberIds),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((linked) => LinkedPhoneNumberResponseDto.fromDto(linked));
  }
}
