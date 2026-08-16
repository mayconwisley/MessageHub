import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediatorModule } from '@shared/mediator';
import { ConfigureEmailSmtpHandler } from './application/handlers/configure-email-smtp.handler';
import { GetEmailSmtpConfigurationHandler } from './application/handlers/get-email-smtp-configuration.handler';
import { RemoveEmailSmtpHandler } from './application/handlers/remove-email-smtp.handler';
import { SMTP_CONFIGURATION_RESOLVER } from './application/ports/smtp-configuration-resolver.interface';
import { SmtpConfigurationResolverService } from './application/services/smtp-configuration-resolver.service';
import { EMAIL_SMTP_CONFIGURATION_REPOSITORY } from './domain/repositories/email-smtp-configuration.repository.interface';
import { EmailSmtpConfigurationOrmEntity } from './infrastructure/entities/email-smtp-configuration.orm-entity';
import { PostgresEmailSmtpConfigurationRepository } from './infrastructure/repositories/postgres-email-smtp-configuration.repository';
import { SmtpPasswordCipherService } from './infrastructure/security/smtp-password-cipher.service';
import { EmailSmtpConfigurationsController } from './presentation/controllers/email-smtp-configurations.controller';

@Module({
  imports: [MediatorModule, TypeOrmModule.forFeature([EmailSmtpConfigurationOrmEntity])],
  controllers: [EmailSmtpConfigurationsController],
  providers: [
    {
      provide: EMAIL_SMTP_CONFIGURATION_REPOSITORY,
      useClass: PostgresEmailSmtpConfigurationRepository,
    },
    { provide: SMTP_CONFIGURATION_RESOLVER, useClass: SmtpConfigurationResolverService },
    SmtpPasswordCipherService,
    ConfigureEmailSmtpHandler,
    GetEmailSmtpConfigurationHandler,
    RemoveEmailSmtpHandler,
  ],
  exports: [SMTP_CONFIGURATION_RESOLVER],
})
export class EmailConfigurationsModule {}
