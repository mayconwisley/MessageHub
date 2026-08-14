import { Controller, Get, Inject, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { GetIntegrationMonitorQuery } from '../application/queries/get-integration-monitor.query';
@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/monitoring')
export class MonitoringController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}
  @Get('applications/:applicationId')
  async get(@Param('applicationId', ParseUUIDPipe) applicationId: string) {
    const result = await this.mediator.query(new GetIntegrationMonitorQuery(applicationId));
    if (result.isFailure) throw toHttpException(result.error);
    return result.value;
  }
}
