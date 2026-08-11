import { Global, Module } from '@nestjs/common';
import { IdentityModule } from '@modules/identity/identity.module';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { UserSessionAuthGuard } from './guards/user-session-auth.guard';

/** Dependência transversal para os endpoints de administração da plataforma. */
@Global()
@Module({
  imports: [IdentityModule],
  providers: [UserSessionAuthGuard, PlatformAdminGuard],
  exports: [UserSessionAuthGuard, PlatformAdminGuard],
})
export class AdministrationSecurityModule {}
