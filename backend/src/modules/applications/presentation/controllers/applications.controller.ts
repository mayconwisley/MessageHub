import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { CreateApplicationCommand } from '../../application/commands/create-application.command';
import { ConfigureApplicationWebhookCommand } from '../../application/commands/configure-application-webhook.command';
import { SetApplicationPhoneNumbersCommand } from '../../application/commands/set-application-phone-numbers.command';
import { ListApplicationsQuery } from '../../application/queries/list-applications.query';
import { ListApplicationPhoneNumbersQuery } from '../../application/queries/list-application-phone-numbers.query';
import { ApplicationResponseDto } from '../dto/application-response.dto';
import { CreateApplicationRequestDto } from '../dto/create-application-request.dto';
import { ConfigureWebhookRequestDto } from '../dto/configure-webhook-request.dto';
import { WebhookConfigResponseDto } from '../dto/webhook-config-response.dto';
import { SetApplicationPhoneNumbersRequestDto } from '../dto/set-application-phone-numbers-request.dto';
import { LinkedPhoneNumberResponseDto } from '../dto/linked-phone-number-response.dto';

class ListApplicationsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;
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
  async list(
    @Query() query: ListApplicationsRequestDto,
  ): Promise<PaginatedResult<ApplicationResponseDto>> {
    if (!query.tenantId) {
      throw new BadRequestException('tenantId é obrigatório.');
    }
    const result = await this.mediator.query(
      new ListApplicationsQuery(query.tenantId, query.page, query.pageSize),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return { ...result.value, items: result.value.items.map(ApplicationResponseDto.fromDto) };
  }

  @Put(':applicationId/webhook')
  @ApiResponse({ status: HttpStatus.OK, type: WebhookConfigResponseDto })
  async configureWebhook(
    @Param('applicationId') applicationId: string,
    @Body() dto: ConfigureWebhookRequestDto,
  ): Promise<WebhookConfigResponseDto> {
    const result = await this.mediator.send(
      new ConfigureApplicationWebhookCommand(applicationId, dto.webhookUrl ?? null),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return WebhookConfigResponseDto.fromDto(result.value);
  }

  @Get(':applicationId/phone-numbers')
  @ApiResponse({ status: HttpStatus.OK, type: [LinkedPhoneNumberResponseDto] })
  async listPhoneNumbers(
    @Param('applicationId') applicationId: string,
  ): Promise<LinkedPhoneNumberResponseDto[]> {
    const result = await this.mediator.query(new ListApplicationPhoneNumbersQuery(applicationId));
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((dto) => LinkedPhoneNumberResponseDto.fromDto(dto));
  }

  @Put(':applicationId/phone-numbers')
  @ApiResponse({ status: HttpStatus.OK, type: [LinkedPhoneNumberResponseDto] })
  async setPhoneNumbers(
    @Param('applicationId') applicationId: string,
    @Body() dto: SetApplicationPhoneNumbersRequestDto,
  ): Promise<LinkedPhoneNumberResponseDto[]> {
    const result = await this.mediator.send(
      new SetApplicationPhoneNumbersCommand(applicationId, dto.phoneNumberIds),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value.map((linked) => LinkedPhoneNumberResponseDto.fromDto(linked));
  }
}
