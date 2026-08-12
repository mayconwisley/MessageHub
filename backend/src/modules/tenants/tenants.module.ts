import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository.interface';
import { CreateTenantHandler } from './application/handlers/create-tenant.handler';
import { GetTenantHandler } from './application/handlers/get-tenant.handler';
import { ListTenantsHandler } from './application/handlers/list-tenants.handler';
import { TenantOrmEntity } from './infrastructure/entities/tenant.orm-entity';
import { PostgresTenantRepository } from './infrastructure/repositories/postgres-tenant.repository';
import { TenantsController } from './presentation/controllers/tenants.controller';

@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([TenantOrmEntity])],
  controllers: [TenantsController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: PostgresTenantRepository },
    CreateTenantHandler,
    GetTenantHandler,
    ListTenantsHandler,
  ],
  exports: [TENANT_REPOSITORY],
})
export class TenantsModule {}
