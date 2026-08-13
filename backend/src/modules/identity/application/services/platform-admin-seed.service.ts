import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';
import { IMediator, MEDIATOR } from '@shared/mediator';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/enums/user-role.enum';
import { CreateUserCommand } from '../commands/create-user.command';

/** Garante a existência de um administrador da plataforma na primeira inicialização. */
@Injectable()
export class PlatformAdminSeedService implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(MEDIATOR) private readonly mediator: IMediator,
    private readonly appConfig: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if ((await this.users.count()) > 0) return;
    await this.mediator.send(
      new CreateUserCommand(
        'Platform Administrator',
        this.appConfig.initialPlatformAdminEmail,
        this.appConfig.initialPlatformAdminPassword,
        UserRole.PLATFORM_ADMIN,
      ),
    );
  }
}
