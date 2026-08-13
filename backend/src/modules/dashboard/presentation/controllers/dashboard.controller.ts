import { Controller, ForbiddenException, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { CurrentAuthenticatedUser } from '@presentation/http/decorators/current-authenticated-user.decorator';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { AuthenticatedUserDto } from '@modules/identity/application/dto/authenticated-user.dto';
import { UserRole } from '@modules/identity/domain/enums/user-role.enum';
import { GetDeliveryStatusQuery } from '../../application/queries/get-delivery-status.query';
import { GetMessageVolumeQuery } from '../../application/queries/get-message-volume.query';
import { GetOperationalHealthQuery } from '../../application/queries/get-operational-health.query';
import { GetRecentMessagesQuery } from '../../application/queries/get-recent-messages.query';
import { GetResourceSummaryQuery } from '../../application/queries/get-resource-summary.query';

function resolveTenantScope(user: AuthenticatedUserDto): string | undefined {
  if (user.role === UserRole.PLATFORM_ADMIN) return undefined;
  if (!user.tenantId) {
    throw new ForbiddenException('Usuário não possui escopo de tenant para acessar o dashboard.');
  }
  return user.tenantId;
}

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(UserSessionAuthGuard)
@Controller('v1/dashboard')
export class DashboardController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Get('resource-summary')
  resourceSummary(@CurrentAuthenticatedUser() user: AuthenticatedUserDto) {
    return this.mediator.query(new GetResourceSummaryQuery(resolveTenantScope(user)));
  }

  @Get('message-volume')
  messageVolume(@CurrentAuthenticatedUser() user: AuthenticatedUserDto) {
    return this.mediator.query(new GetMessageVolumeQuery(resolveTenantScope(user)));
  }

  @Get('delivery-status')
  deliveryStatus(@CurrentAuthenticatedUser() user: AuthenticatedUserDto) {
    return this.mediator.query(new GetDeliveryStatusQuery(resolveTenantScope(user)));
  }

  @Get('operational-health')
  operationalHealth(@CurrentAuthenticatedUser() user: AuthenticatedUserDto) {
    return this.mediator.query(new GetOperationalHealthQuery(resolveTenantScope(user)));
  }

  @Get('recent-messages')
  recentMessages(@CurrentAuthenticatedUser() user: AuthenticatedUserDto) {
    return this.mediator.query(new GetRecentMessagesQuery(resolveTenantScope(user)));
  }
}
