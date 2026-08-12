import {
  Body,
  BadRequestException,
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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PlatformAdminOrTenantApiKeyGuard } from '@presentation/http/guards/platform-admin-or-tenant-api-key.guard';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { RegisterWhatsAppAccountCommand } from '../../application/commands/register-whatsapp-account.command';
import { GetWhatsAppAccountQuery } from '../../application/queries/get-whatsapp-account.query';
import { RegisterWhatsAppAccountRequestDto } from '../dto/register-whatsapp-account-request.dto';
import { WhatsAppAccountResponseDto } from '../dto/whatsapp-account-response.dto';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ListWhatsAppAccountsQuery } from '../../application/queries/list-whatsapp-accounts.query';
import { PaginatedResult } from '@shared/types';

class ListWhatsAppAccountsRequestDto extends PaginationQueryDto {
  tenantId?: string;
}

@ApiTags('whatsapp-accounts')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrTenantApiKeyGuard)
@Controller('v1/whatsapp-accounts')
export class WhatsAppAccountsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: WhatsAppAccountResponseDto })
  async register(
    @Body() dto: RegisterWhatsAppAccountRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<WhatsAppAccountResponseDto> {
    const result = await this.mediator.send(
      new RegisterWhatsAppAccountCommand(
        auth?.tenantId ?? user?.tenantId ?? this.requireTenantId(dto.tenantId),
        dto.wabaId,
        dto.credentialSource,
        dto.accessToken,
        dto.appSecret,
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
      new ListWhatsAppAccountsQuery(tenantId, query.page, query.pageSize),
    );
    if (result.isFailure) throw new InternalServerErrorException();
    return { ...result.value, items: result.value.items.map(WhatsAppAccountResponseDto.fromDto) };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: WhatsAppAccountResponseDto })
  async getById(
    @Param('id') id: string,
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
      throw new BadRequestException('tenantId is required for administrative requests.');
    return tenantId;
  }
}
