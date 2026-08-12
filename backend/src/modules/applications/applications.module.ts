import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { CreateApiKeyHandler } from './application/handlers/create-api-key.handler';
import { CreateApplicationHandler } from './application/handlers/create-application.handler';
import { RevokeApiKeyHandler } from './application/handlers/revoke-api-key.handler';
import { ValidateApiKeyHandler } from './application/handlers/validate-api-key.handler';
import { ApiKeyGeneratorService } from './application/services/api-key-generator.service';
import { API_KEY_REPOSITORY } from './domain/repositories/api-key.repository.interface';
import { APPLICATION_REPOSITORY } from './domain/repositories/application.repository.interface';
import { ApiKeyOrmEntity } from './infrastructure/entities/api-key.orm-entity';
import { ApplicationOrmEntity } from './infrastructure/entities/application.orm-entity';
import { PostgresApiKeyRepository } from './infrastructure/repositories/postgres-api-key.repository';
import { PostgresApplicationRepository } from './infrastructure/repositories/postgres-application.repository';
import { ApiKeysController } from './presentation/controllers/api-keys.controller';
import { ApplicationsController } from './presentation/controllers/applications.controller';

@Module({
  imports: [
    MediatorModule,
    TenantsModule,
    TypeOrmModule.forFeature([ApplicationOrmEntity, ApiKeyOrmEntity]),
  ],
  controllers: [ApplicationsController, ApiKeysController],
  providers: [
    { provide: APPLICATION_REPOSITORY, useClass: PostgresApplicationRepository },
    { provide: API_KEY_REPOSITORY, useClass: PostgresApiKeyRepository },
    ApiKeyGeneratorService,
    CreateApplicationHandler,
    CreateApiKeyHandler,
    RevokeApiKeyHandler,
    ValidateApiKeyHandler,
  ],
  exports: [APPLICATION_REPOSITORY, API_KEY_REPOSITORY],
})
export class ApplicationsModule {}
