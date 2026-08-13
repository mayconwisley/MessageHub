import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RabbitMqModule } from './infrastructure/messaging/rabbitmq/rabbitmq.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WhatsAppAccountsModule } from './modules/whatsapp-accounts/whatsapp-accounts.module';
import { IdentityModule } from './modules/identity/identity.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthController } from './presentation/http/controllers/health.controller';
import { AdministrationSecurityModule } from './presentation/http/administration-security.module';
import { GlobalExceptionFilter } from './presentation/http/filters/global-exception.filter';
import { AuditLogInterceptor } from './presentation/http/interceptors/audit-log.interceptor';
import { AppThrottlerGuard } from './presentation/http/guards/app-throttler.guard';
import { DefaultChannelSeedService } from './modules/whatsapp-accounts/application/services/default-channel-seed.service';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigurationModule,
    AdministrationSecurityModule,
    LoggingModule,
    DatabaseModule,
    RabbitMqModule,
    TerminusModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
    }),
    TenantsModule,
    IdentityModule,
    AuditModule,
    ApplicationsModule,
    WhatsAppAccountsModule,
    PhoneNumbersModule,
    MessagesModule,
    TemplatesModule,
    WebhooksModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    DefaultChannelSeedService,
  ],
})
export class AppModule {}
