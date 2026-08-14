import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PlatformAdminOrTenantApiKeyGuard } from '@presentation/http/guards/platform-admin-or-tenant-api-key.guard';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { RegisterWhatsAppAccountCommand } from '../../application/commands/register-whatsapp-account.command';
import { EnsureDefaultChannelAccountCommand } from '../../application/commands/ensure-default-channel-account.command';
import { GetWhatsAppAccountQuery } from '../../application/queries/get-whatsapp-account.query';
import { RegisterWhatsAppAccountRequestDto } from '../dto/register-whatsapp-account-request.dto';
import { EnsureDefaultChannelAccountRequestDto } from '../dto/ensure-default-channel-account-request.dto';
import { WhatsAppAccountResponseDto } from '../dto/whatsapp-account-response.dto';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ListWhatsAppAccountsQuery } from '../../application/queries/list-whatsapp-accounts.query';
import { PaginatedResult } from '@shared/types';
import { WhatsAppAccountStatus } from '../../domain/enums/whatsapp-account-status.enum';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';

class ListWhatsAppAccountsRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: WhatsAppAccountStatus })
  @IsOptional()
  @IsEnum(WhatsAppAccountStatus)
  status?: WhatsAppAccountStatus;

  @ApiPropertyOptional({ description: 'Busca por WABA ID.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

@ApiTags('whatsapp-accounts')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrTenantApiKeyGuard)
@Controller('v1/whatsapp-accounts')
export class WhatsAppAccountsController {
  constructor(
    @Inject(MEDIATOR) private readonly mediator: IMediator,
    private readonly metaConfig: MetaConfigService,
  ) {}

  @Get('default-channel')
  getDefaultChannel(): { enabled: boolean; wabaId: string | null } {
    return {
      enabled: this.metaConfig.defaultChannelEnabled && !!this.metaConfig.defaultWabaId,
      wabaId: this.metaConfig.defaultWabaId,
    };
  }

  @Post('default-channel/ensure')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: HttpStatus.OK, type: WhatsAppAccountResponseDto })
  async ensureDefaultChannel(
    @Body() dto: EnsureDefaultChannelAccountRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<WhatsAppAccountResponseDto> {
    if (dto.tenantId !== this.metaConfig.defaultTenantId) {
      throw new BadRequestException(
        'O canal padrão é sincronizado automaticamente somente para o tenant configurado no ambiente.',
      );
    }
    const tenantId = auth?.tenantId ?? user?.tenantId ?? this.requireTenantId(dto.tenantId);
    const result = await this.mediator.send(new EnsureDefaultChannelAccountCommand(tenantId));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return WhatsAppAccountResponseDto.fromDto(result.value);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: WhatsAppAccountResponseDto })
  async register(
    @Body() dto: RegisterWhatsAppAccountRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<WhatsAppAccountResponseDto> {
    if (dto.credentialSource === WhatsAppCredentialSource.DEFAULT) {
      throw new BadRequestException(
        'A conta do canal padrão é gerenciada exclusivamente pelas variáveis de ambiente.',
      );
    }
    const result = await this.mediator.send(
      new RegisterWhatsAppAccountCommand(
        auth?.tenantId ?? user?.tenantId ?? this.requireTenantId(dto.tenantId),
        dto.wabaId,
        dto.credentialSource,
        dto.accessToken,
        dto.appSecret,
        dto.credentialExpiresAt ? new Date(dto.credentialExpiresAt) : undefined,
      ),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return WhatsAppAccountResponseDto.fromDto(result.value);
  }

  @Get()
  async list(
    @Query() query: ListWhatsAppAccountsRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PaginatedResult<WhatsAppAccountResponseDto>> {
    const tenantId = auth?.tenantId ?? user?.tenantId ?? this.requireTenantId(query.tenantId);
    const result = await this.mediator.query(
      new ListWhatsAppAccountsQuery(tenantId, query.page, query.pageSize, query.status, query.search),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((account) => WhatsAppAccountResponseDto.fromDto(account)),
    };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: WhatsAppAccountResponseDto })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<WhatsAppAccountResponseDto> {
    const result = await this.mediator.query(
      new GetWhatsAppAccountQuery(id, auth?.tenantId ?? user?.tenantId ?? undefined),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return WhatsAppAccountResponseDto.fromDto(result.value);
  }

  private requireTenantId(tenantId: string | undefined): string {
    if (!tenantId)
      throw new BadRequestException('tenantId é obrigatório para requisições administrativas.');
    return tenantId;
  }
}
