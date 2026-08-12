import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { IdentityService } from '../../infrastructure/services/identity.service';
import { LoginRequestDto } from '../dto/login-request.dto';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly identity: IdentityService) {}

  @Post('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessão autenticada criada.' })
  async login(@Body() dto: LoginRequestDto, @Req() request: Request) {
    const result = await this.identity.authenticate(dto.email, dto.password, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    if (!result) return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    return result;
  }
}
