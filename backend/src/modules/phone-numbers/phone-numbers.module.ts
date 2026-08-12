import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { WhatsAppAccountsModule } from '@modules/whatsapp-accounts/whatsapp-accounts.module';
import { GetPhoneNumberHandler } from './application/handlers/get-phone-number.handler';
import { RegisterPhoneNumberHandler } from './application/handlers/register-phone-number.handler';
import { ListPhoneNumbersHandler } from './application/handlers/list-phone-numbers.handler';
import { PHONE_NUMBER_REPOSITORY } from './domain/repositories/phone-number.repository.interface';
import { PhoneNumberOrmEntity } from './infrastructure/entities/phone-number.orm-entity';
import { PostgresPhoneNumberRepository } from './infrastructure/repositories/postgres-phone-number.repository';
import { PhoneNumbersController } from './presentation/controllers/phone-numbers.controller';

@Module({
  imports: [
    MediatorModule,
    WhatsAppAccountsModule,
    TypeOrmModule.forFeature([PhoneNumberOrmEntity]),
  ],
  controllers: [PhoneNumbersController],
  providers: [
    { provide: PHONE_NUMBER_REPOSITORY, useClass: PostgresPhoneNumberRepository },
    RegisterPhoneNumberHandler,
    GetPhoneNumberHandler,
    ListPhoneNumbersHandler,
  ],
  exports: [PHONE_NUMBER_REPOSITORY],
})
export class PhoneNumbersModule {}
