import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserSessionOrmEntity } from './infrastructure/entities/user-session.orm-entity';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { USER_SESSION_REPOSITORY } from './domain/repositories/user-session.repository.interface';
import { PostgresUserRepository } from './infrastructure/repositories/postgres-user.repository';
import { PostgresUserSessionRepository } from './infrastructure/repositories/postgres-user-session.repository';
import { UserSessionService } from './application/services/user-session.service';
import { PlatformAdminSeedService } from './application/services/platform-admin-seed.service';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { UpdateUserHandler } from './application/handlers/update-user.handler';
import { UpdateUserStatusHandler } from './application/handlers/update-user-status.handler';
import { ListUsersHandler } from './application/handlers/list-users.handler';
import { GetUserHandler } from './application/handlers/get-user.handler';
import { LoginHandler } from './application/handlers/login.handler';
import { LogoutHandler } from './application/handlers/logout.handler';

@Global()
@Module({
  imports: [
    MediatorModule,
    TenantsModule,
    TypeOrmModule.forFeature([UserOrmEntity, UserSessionOrmEntity]),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
    { provide: USER_SESSION_REPOSITORY, useClass: PostgresUserSessionRepository },
    UserSessionService,
    PlatformAdminSeedService,
    CreateUserHandler,
    UpdateUserHandler,
    UpdateUserStatusHandler,
    ListUsersHandler,
    GetUserHandler,
    LoginHandler,
    LogoutHandler,
  ],
  exports: [UserSessionService, USER_REPOSITORY],
})
export class IdentityModule {}
