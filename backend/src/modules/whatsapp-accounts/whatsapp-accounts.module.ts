import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { GetWhatsAppAccountHandler } from './application/handlers/get-whatsapp-account.handler';
import { RegisterWhatsAppAccountHandler } from './application/handlers/register-whatsapp-account.handler';
import { ListWhatsAppAccountsHandler } from './application/handlers/list-whatsapp-accounts.handler';
import { WHATSAPP_ACCOUNT_REPOSITORY } from './domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountOrmEntity } from './infrastructure/entities/whatsapp-account.orm-entity';
import { PostgresWhatsAppAccountRepository } from './infrastructure/repositories/postgres-whatsapp-account.repository';
import { AccessTokenCipherService } from './infrastructure/security/access-token-cipher.service';
import { WhatsAppAccountsController } from './presentation/controllers/whatsapp-accounts.controller';

@Module({
  imports: [MediatorModule, TenantsModule, TypeOrmModule.forFeature([WhatsAppAccountOrmEntity])],
  controllers: [WhatsAppAccountsController],
  providers: [
    { provide: WHATSAPP_ACCOUNT_REPOSITORY, useClass: PostgresWhatsAppAccountRepository },
    AccessTokenCipherService,
    RegisterWhatsAppAccountHandler,
    GetWhatsAppAccountHandler,
    ListWhatsAppAccountsHandler,
  ],
  exports: [WHATSAPP_ACCOUNT_REPOSITORY],
})
export class WhatsAppAccountsModule {}
