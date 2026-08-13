import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { IdentityService } from './infrastructure/services/identity.service';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserSessionOrmEntity } from './infrastructure/entities/user-session.orm-entity';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PostgresUserRepository } from './infrastructure/repositories/postgres-user.repository';
import { CreateUserHandler } from './application/handlers/create-user.handler';
import { UpdateUserHandler } from './application/handlers/update-user.handler';
import { UpdateUserStatusHandler } from './application/handlers/update-user-status.handler';
import { ListUsersHandler } from './application/handlers/list-users.handler';
import { GetUserHandler } from './application/handlers/get-user.handler';

@Global()
@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([UserOrmEntity, UserSessionOrmEntity])],
  controllers: [AuthController, UsersController],
  providers: [
    IdentityService,
    { provide: USER_REPOSITORY, useClass: PostgresUserRepository },
    CreateUserHandler,
    UpdateUserHandler,
    UpdateUserStatusHandler,
    ListUsersHandler,
    GetUserHandler,
  ],
  exports: [IdentityService, USER_REPOSITORY],
})
export class IdentityModule {}
