import {
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { IdentityService } from '../../infrastructure/services/identity.service';
import { LoginRequestDto } from '../dto/login-request.dto';
import { InvalidCredentialsError } from '../../domain/errors';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly identity: IdentityService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessão autenticada criada.' })
  async login(@Body() dto: LoginRequestDto, @Req() request: Request) {
    const result = await this.identity.authenticate(dto.email, dto.password, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    if (!result) throw toHttpException(new InvalidCredentialsError());
    return result;
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(UserSessionAuthGuard)
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Sessão revogada.' })
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (token) await this.identity.revokeSession(token);
  }
}
