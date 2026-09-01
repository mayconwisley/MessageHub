import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { PhoneNumbersModule } from '@modules/phone-numbers/phone-numbers.module';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { CreateApiKeyHandler } from './application/handlers/create-api-key.handler';
import { CreateApplicationHandler } from './application/handlers/create-application.handler';
import { ConfigureApplicationWebhookHandler } from './application/handlers/configure-application-webhook.handler';
import { ConfigureApplicationQuotasHandler } from './application/handlers/configure-application-quotas.handler';
import { SetApplicationPhoneNumbersHandler } from './application/handlers/set-application-phone-numbers.handler';
import { ListApiKeysHandler } from './application/handlers/list-api-keys.handler';
import { ListApplicationsHandler } from './application/handlers/list-applications.handler';
import { GetApplicationHandler } from './application/handlers/get-application.handler';
import { ListApplicationPhoneNumbersHandler } from './application/handlers/list-application-phone-numbers.handler';
import { RevokeApiKeyHandler } from './application/handlers/revoke-api-key.handler';
import { ValidateApiKeyHandler } from './application/handlers/validate-api-key.handler';
import { ApiKeyGeneratorService } from './application/services/api-key-generator.service';
import { API_KEY_REPOSITORY } from './domain/repositories/api-key.repository.interface';
import { APPLICATION_REPOSITORY } from './domain/repositories/application.repository.interface';
import { APPLICATION_PHONE_NUMBER_LINK_REPOSITORY } from './domain/repositories/application-phone-number-link.repository.interface';
import { ApiKeyOrmEntity } from './infrastructure/entities/api-key.orm-entity';
import { ApplicationOrmEntity } from './infrastructure/entities/application.orm-entity';
import { ApplicationPhoneNumberLinkOrmEntity } from './infrastructure/entities/application-phone-number-link.orm-entity';
import { PostgresApiKeyRepository } from './infrastructure/repositories/postgres-api-key.repository';
import { WebhookSecretCipherService } from './infrastructure/security/webhook-secret-cipher.service';
import { PostgresApplicationRepository } from './infrastructure/repositories/postgres-application.repository';
import { PostgresApplicationPhoneNumberLinkRepository } from './infrastructure/repositories/postgres-application-phone-number-link.repository';
import { ApiKeysController } from './presentation/controllers/api-keys.controller';
import { ApplicationsController } from './presentation/controllers/applications.controller';

@Module({
  imports: [
    MediatorModule,
    TenantsModule,
    PhoneNumbersModule,
    WhatsAppAccountsModule,
    TypeOrmModule.forFeature([
      ApplicationOrmEntity,
      ApiKeyOrmEntity,
      ApplicationPhoneNumberLinkOrmEntity,
    ]),
  ],
  controllers: [ApplicationsController, ApiKeysController],
  providers: [
    { provide: APPLICATION_REPOSITORY, useClass: PostgresApplicationRepository },
    WebhookSecretCipherService,
    { provide: API_KEY_REPOSITORY, useClass: PostgresApiKeyRepository },
    {
      provide: APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
      useClass: PostgresApplicationPhoneNumberLinkRepository,
    },
    ApiKeyGeneratorService,
    CreateApplicationHandler,
    ConfigureApplicationWebhookHandler,
    ConfigureApplicationQuotasHandler,
    SetApplicationPhoneNumbersHandler,
    CreateApiKeyHandler,
    ListApplicationsHandler,
    GetApplicationHandler,
    ListApplicationPhoneNumbersHandler,
    ListApiKeysHandler,
    RevokeApiKeyHandler,
    ValidateApiKeyHandler,
  ],
  exports: [APPLICATION_REPOSITORY, API_KEY_REPOSITORY, APPLICATION_PHONE_NUMBER_LINK_REPOSITORY],
})
export class ApplicationsModule {}
