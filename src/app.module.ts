import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
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

@Module({
  imports: [
    ConfigurationModule,
    AdministrationSecurityModule,
    LoggingModule,
    DatabaseModule,
    RabbitMqModule,
    TerminusModule,
    TenantsModule,
    IdentityModule,
    AuditModule,
    ApplicationsModule,
    WhatsAppAccountsModule,
    PhoneNumbersModule,
    MessagesModule,
    TemplatesModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
