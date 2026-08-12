import { BadRequestException, Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './infrastructure/configuration/app-config.service';
import { translateValidationErrors } from './presentation/http/validation-message.translator';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  const appConfig = app.get(AppConfigService);

  app.use(helmet());
  app.use(compression());
  app.enableCors(
    appConfig.corsOrigins.length > 0 ? { origin: appConfig.corsOrigins, credentials: true } : {},
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(translateValidationErrors(errors)),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Message Hub')
    .setDescription(
      'WhatsApp/Messaging Hub - API interna de integracao com a Meta WhatsApp Business Platform',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(appConfig.port);

  const baseUrl = `http://localhost:${appConfig.port}`;
  logger.log(
    {
      apiUrl: baseUrl,
      swaggerUrl: `${baseUrl}/docs`,
      healthUrl: `${baseUrl}/health`,
    },
    'Message Hub iniciado e pronto para receber requisicoes',
  );
}

void bootstrap().catch((error: unknown) => {
  const logger = new NestLogger('Bootstrap');
  logger.error(
    'Falha ao inicializar o Message Hub.',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
