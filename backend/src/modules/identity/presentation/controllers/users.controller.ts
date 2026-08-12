import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IdentityService } from '../../infrastructure/services/identity.service';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
export class UsersController {
  constructor(private readonly identity: IdentityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Usuário criado.' })
  create(@Body() dto: CreateUserRequestDto) {
    return this.identity.createUser(dto);
  }
}
