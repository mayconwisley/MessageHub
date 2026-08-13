import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import {
  UserAuthenticatedRequest,
  UserSessionAuthGuard,
} from '@presentation/http/guards/user-session-auth.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { PaginationQueryDto } from '@presentation/http/dto/pagination-query.dto';
import { PaginatedResult } from '@shared/types';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { UpdateUserStatusCommand } from '../../application/commands/update-user-status.command';
import { ListUsersQuery } from '../../application/queries/list-users.query';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { UserRole } from '../../domain/enums/user-role.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { CreateUserRequestDto } from '../dto/create-user-request.dto';
import { UpdateUserRequestDto } from '../dto/update-user-request.dto';
import { UpdateUserStatusRequestDto } from '../dto/update-user-status-request.dto';
import { UserResponseDto } from '../dto/user-response.dto';

class ListUsersRequestDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Filtra usuários cujo nome ou e-mail contenha este texto.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
export class UsersController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: UserResponseDto })
  async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const result = await this.mediator.send(
      new CreateUserCommand(dto.name, dto.email, dto.password, dto.role, dto.tenantId),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return UserResponseDto.fromDto(result.value);
  }

  @Get()
  async list(@Query() query: ListUsersRequestDto): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.mediator.query(
      new ListUsersQuery(
        query.page,
        query.pageSize,
        query.tenantId,
        query.role,
        query.status,
        query.search,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
    return {
      ...result.value,
      items: result.value.items.map((user) => UserResponseDto.fromDto(user)),
    };
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    const result = await this.mediator.query(new GetUserQuery(id));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return UserResponseDto.fromDto(result.value);
  }

  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    const result = await this.mediator.send(
      new UpdateUserCommand(id, dto.name, dto.email, dto.role, dto.tenantId),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return UserResponseDto.fromDto(result.value);
  }

  @Patch(':id/status')
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusRequestDto,
    @Req() request: UserAuthenticatedRequest,
  ): Promise<UserResponseDto> {
    if (dto.status === UserStatus.SUSPENDED && request.user?.id === id) {
      throw new ForbiddenException('Você não pode desativar sua própria conta.');
    }
    const result = await this.mediator.send(new UpdateUserStatusCommand(id, dto.status));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return UserResponseDto.fromDto(result.value);
  }
}
