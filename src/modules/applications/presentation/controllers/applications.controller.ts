import { Body, Controller, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateApplicationCommand } from '../../application/commands/create-application.command';
import { ApplicationResponseDto } from '../dto/application-response.dto';
import { CreateApplicationRequestDto } from '../dto/create-application-request.dto';

@ApiTags('applications')
@ApiHeader({ name: 'Authorization', required: true })
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/applications')
export class ApplicationsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: ApplicationResponseDto })
  async create(@Body() dto: CreateApplicationRequestDto): Promise<ApplicationResponseDto> {
    const result = await this.mediator.send(new CreateApplicationCommand(dto.tenantId, dto.name));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return ApplicationResponseDto.fromDto(result.value);
  }
}
