import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { AppConfigService } from './app-config.service';
import { databaseConfig } from './database.config';
import { DatabaseConfigService } from './database-config.service';
import { validateEnv } from './env.validation';
import { metaConfig } from './meta.config';
import { MetaConfigService } from './meta-config.service';
import { rabbitmqConfig } from './rabbitmq.config';
import { RabbitMqConfigService } from './rabbitmq-config.service';
import { SmtpConfigService } from './smtp-config.service';
import { smtpConfig } from './smtp.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, rabbitmqConfig, metaConfig, smtpConfig],
      validate: validateEnv,
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    RabbitMqConfigService,
    MetaConfigService,
    SmtpConfigService,
  ],
  exports: [
    AppConfigService,
    DatabaseConfigService,
    RabbitMqConfigService,
    MetaConfigService,
    SmtpConfigService,
  ],
})
export class ConfigurationModule {}
