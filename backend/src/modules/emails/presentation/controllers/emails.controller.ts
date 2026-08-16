import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IDEMPOTENCY_KEY_HEADER } from '@shared/constants';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { resolveRequiredApplicationId } from '@presentation/http/auth-scope.resolver';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { CurrentOptionalAuthContext } from '@presentation/http/decorators/current-optional-auth-context.decorator';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { SendEmailCommand } from '../../application/commands/send-email.command';
import { EmailMessageResponseDto } from '../dto/email-message-response.dto';
import { SendEmailRequestDto } from '../dto/send-email-request.dto';

@ApiTags('emails')
@ApiBearerAuth()
@UseGuards(PlatformAdminOrApiKeyGuard)
@Controller('v1/emails')
export class EmailsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: EmailMessageResponseDto })
  async send(
    @Body() dto: SendEmailRequestDto,
    @CurrentOptionalAuthContext() auth?: AuthContextDto,
    @CurrentAuthenticatedUser() user?: AuthenticatedUserDto,
    @Headers(IDEMPOTENCY_KEY_HEADER) idempotencyKey?: string,
    @Req() request?: Request & { id?: string },
  ): Promise<EmailMessageResponseDto> {
    const requestingTenantId =
      user?.role === UserRole.TENANT_ADMIN ? (user.tenantId ?? undefined) : undefined;
    const result = await this.mediator.send(
      new SendEmailCommand(
        resolveRequiredApplicationId(auth, dto.applicationId),
        dto.to,
        dto.subject,
        dto.textBody,
        dto.htmlBody,
        idempotencyKey,
        request?.id,
        requestingTenantId,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return EmailMessageResponseDto.fromDto(result.value);
  }
}
