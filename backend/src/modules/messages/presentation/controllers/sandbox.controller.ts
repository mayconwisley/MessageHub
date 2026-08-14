import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { SandboxWebhookSimulatorService } from '../../infrastructure/services/sandbox-webhook-simulator.service';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';

class SimulateWebhookStatusRequestDto {
  @IsEnum(['DELIVERED', 'READ', 'FAILED'])
  status!: 'DELIVERED' | 'READ' | 'FAILED';
}

@ApiTags('sandbox')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/sandbox/messages')
export class SandboxController {
  constructor(
    private readonly simulator: SandboxWebhookSimulatorService,
    private readonly config: AppConfigService,
  ) {}

  @Get('configuration')
  configuration(): { enabled: boolean; activeProvider: 'meta' | 'sandbox' } {
    return { enabled: this.config.sandboxEnabled, activeProvider: this.config.messageProvider };
  }

  @Post(':id/status')
  @HttpCode(HttpStatus.ACCEPTED)
  simulateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SimulateWebhookStatusRequestDto,
  ): Promise<void> {
    return this.simulator.simulateStatus(id, body.status);
  }
}
