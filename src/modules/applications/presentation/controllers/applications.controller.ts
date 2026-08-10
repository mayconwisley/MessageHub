import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { CreateApplicationCommand } from '../../application/commands/create-application.command';
import { ApplicationResponseDto } from '../dto/application-response.dto';
import { CreateApplicationRequestDto } from '../dto/create-application-request.dto';

@ApiTags('applications')
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
