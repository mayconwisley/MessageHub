import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { PlatformAdminOrTenantApiKeyGuard } from '@presentation/http/guards/platform-admin-or-tenant-api-key.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { ConfigureEmailSmtpCommand } from '../../application/commands/configure-email-smtp.command';
import { RemoveEmailSmtpCommand } from '../../application/commands/remove-email-smtp.command';
import { GetEmailSmtpConfigurationQuery } from '../../application/queries/get-email-smtp-configuration.query';
import { ConfigureEmailSmtpRequestDto } from '../dto/configure-email-smtp-request.dto';
import { EmailSmtpConfigurationResponseDto } from '../dto/email-smtp-configuration-response.dto';

@ApiTags('email-configurations')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrTenantApiKeyGuard)
@Controller('v1/email-configurations/smtp')
export class EmailSmtpConfigurationsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get()
  @ApiResponse({ status: HttpStatus.OK, type: EmailSmtpConfigurationResponseDto })
  async get(
    @Query('tenantId') tenantId?: string,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<EmailSmtpConfigurationResponseDto> {
    const result = await this.mediator.query(
      new GetEmailSmtpConfigurationQuery(this.resolveTenantId(tenantId, auth, user)),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return EmailSmtpConfigurationResponseDto.fromDto(result.value);
  }

  @Put()
  @ApiResponse({ status: HttpStatus.OK, type: EmailSmtpConfigurationResponseDto })
  async configure(
    @Body() dto: ConfigureEmailSmtpRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<EmailSmtpConfigurationResponseDto> {
    const result = await this.mediator.send(
      new ConfigureEmailSmtpCommand(
        this.resolveTenantId(dto.tenantId, auth, user),
        dto.host,
        dto.port,
        dto.secure,
        dto.username,
        dto.password,
        dto.fromEmail,
        dto.fromName,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return EmailSmtpConfigurationResponseDto.fromDto(result.value);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Query('tenantId') tenantId?: string,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<void> {
    const result = await this.mediator.send(
      new RemoveEmailSmtpCommand(this.resolveTenantId(tenantId, auth, user)),
    );
    if (result.isFailure) throw toHttpException(result.error);
  }

  private resolveTenantId(
    requestedTenantId: string | undefined,
    auth?: AuthContextDto,
    user?: AuthenticatedUserDto,
  ): string {
    const tenantId = auth?.tenantId ?? user?.tenantId ?? requestedTenantId;
    if (!tenantId)
      throw new BadRequestException('tenantId é obrigatório para requisições administrativas.');
    return tenantId;
  }
}
