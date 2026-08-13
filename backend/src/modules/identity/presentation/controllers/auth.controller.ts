import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { LoginCommand } from '../../application/commands/login.command';
import { LogoutCommand } from '../../application/commands/logout.command';
import { LoginRequestDto } from '../dto/login-request.dto';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessão autenticada criada.' })
  async login(@Body() dto: LoginRequestDto, @Req() request: Request) {
    const result = await this.mediator.send(
      new LoginCommand(dto.email, dto.password, request.ip, request.header('user-agent')),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(UserSessionAuthGuard)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Sessão revogada.' })
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    await this.mediator.send(new LogoutCommand(token));
  }
}
