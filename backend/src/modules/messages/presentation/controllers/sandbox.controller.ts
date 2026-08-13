import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { SandboxWebhookSimulatorService } from '../../infrastructure/services/sandbox-webhook-simulator.service';

class SimulateWebhookStatusRequestDto {
  @IsEnum(['DELIVERED', 'READ', 'FAILED'])
  status!: 'DELIVERED' | 'READ' | 'FAILED';
}

@ApiTags('sandbox')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard, PlatformAdminGuard)
@Controller('v1/sandbox/messages')
export class SandboxController {
  constructor(private readonly simulator: SandboxWebhookSimulatorService) {}

  @Post(':id/status')
  @HttpCode(HttpStatus.ACCEPTED)
  simulateStatus(
    @Param('id') id: string,
    @Body() body: SimulateWebhookStatusRequestDto,
  ): Promise<void> {
    return this.simulator.simulateStatus(id, body.status);
  }
}
