import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '@modules/identity/identity.module';
import { MediatorModule } from '@shared/mediator';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { PlatformAdminOrTenantApiKeyGuard } from './guards/platform-admin-or-tenant-api-key.guard';
import { TenantApiKeyGuard } from './guards/tenant-api-key.guard';
import { UserSessionAuthGuard } from './guards/user-session-auth.guard';

/** Dependência transversal para os endpoints de administração da plataforma. */
@Global()
@Module({
  imports: [IdentityModule, MediatorModule],
  providers: [
    UserSessionAuthGuard,
    PlatformAdminGuard,
    ApiKeyAuthGuard,
    TenantApiKeyGuard,
    PlatformAdminOrTenantApiKeyGuard,
  ],
  exports: [
    UserSessionAuthGuard,
    PlatformAdminGuard,
    ApiKeyAuthGuard,
    TenantApiKeyGuard,
    PlatformAdminOrTenantApiKeyGuard,
  ],
})
export class AdministrationSecurityModule {}
