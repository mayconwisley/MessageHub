import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityService } from './infrastructure/services/identity.service';
import { UserOrmEntity } from './infrastructure/entities/user.orm-entity';
import { UserSessionOrmEntity } from './infrastructure/entities/user-session.orm-entity';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, UserSessionOrmEntity])],
  controllers: [AuthController, UsersController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
