import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigurationModule } from './infrastructure/configuration/configuration.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RabbitMqModule } from './infrastructure/messaging/rabbitmq/rabbitmq.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PhoneNumbersModule } from './modules/phone-numbers/phone-numbers.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WhatsAppAccountsModule } from './modules/whatsapp-accounts/whatsapp-accounts.module';
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  imports: [
    ConfigurationModule,
    DatabaseModule,
    RabbitMqModule,
    TerminusModule,
    TenantsModule,
    ApplicationsModule,
    WhatsAppAccountsModule,
    PhoneNumbersModule,
    MessagesModule,
    TemplatesModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
