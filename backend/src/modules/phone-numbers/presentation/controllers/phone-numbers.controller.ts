import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
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
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { ListPhoneNumbersQuery } from '../../application/queries/list-phone-numbers.query';
import { PaginatedResult } from '@shared/types';
import { PhoneNumberStatus } from '../../domain/enums/phone-number-status.enum';

class ListPhoneNumbersRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: PhoneNumberStatus })
  @IsOptional()
  @IsEnum(PhoneNumberStatus)
  status?: PhoneNumberStatus;
}

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

  @Get()
  async list(
    @Query() query: ListPhoneNumbersRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
  ): Promise<PaginatedResult<PhoneNumberResponseDto>> {
    const tenantId = auth?.tenantId ?? user?.tenantId ?? query.tenantId;
    if (!tenantId) throw new BadRequestException('tenantId é obrigatório para requisições administrativas.');
    const result = await this.mediator.query(
      new ListPhoneNumbersQuery(tenantId, query.page, query.pageSize, query.status),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return { ...result.value, items: result.value.items.map(PhoneNumberResponseDto.fromDto) };
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
