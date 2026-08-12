import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
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
import { RegisterPhoneNumberCommand } from '../../application/commands/register-phone-number.command';
import { GetPhoneNumberQuery } from '../../application/queries/get-phone-number.query';
import { PhoneNumberResponseDto } from '../dto/phone-number-response.dto';
import { RegisterPhoneNumberRequestDto } from '../dto/register-phone-number-request.dto';

@ApiTags('phone-numbers')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrTenantApiKeyGuard)
@Controller('v1/phone-numbers')
export class PhoneNumbersController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: PhoneNumberResponseDto })
  async register(
    @Body() dto: RegisterPhoneNumberRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PhoneNumberResponseDto> {
    const result = await this.mediator.send(
      new RegisterPhoneNumberCommand(
        dto.whatsAppAccountId,
        dto.phoneNumberId,
        dto.displayNumber,
        auth?.tenantId ?? user?.tenantId ?? undefined,
      ),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return PhoneNumberResponseDto.fromDto(result.value);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: PhoneNumberResponseDto })
  async getById(
    @Param('id') id: string,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PhoneNumberResponseDto> {
    const result = await this.mediator.query(
      new GetPhoneNumberQuery(id, auth?.tenantId ?? user?.tenantId ?? undefined),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return PhoneNumberResponseDto.fromDto(result.value);
  }
}
