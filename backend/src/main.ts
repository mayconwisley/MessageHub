import { BadRequestException, Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import helmet from 'helmet';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { AppConfigService } from './infrastructure/configuration/app-config.service';
import { translateValidationErrors } from './presentation/http/validation-message.translator';
import { DefaultChannelSeedService } from './modules/whatsapp-accounts/application/services/default-channel-seed.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableShutdownHooks();
  const logger = app.get(Logger);
  app.useLogger(logger);

  const appConfig = app.get(AppConfigService);
  await app.get(DefaultChannelSeedService).synchronize();

  app.use(helmet());
  app.use(compression());
  const expressApp = app.getHttpAdapter().getInstance() as unknown as Express;
  expressApp.disable('x-powered-by');
  if (appConfig.trustProxy) {
    // So confia em X-Forwarded-For quando de fato ha um proxy/load balancer na frente
    // (TRUST_PROXY=true) - caso contrario o rate limit por IP (AppThrottlerGuard) poderia
    // ser contornado por um cliente que forja esse header diretamente.
    expressApp.set('trust proxy', true);
  }
  if (appConfig.corsOrigins.length > 0) {
    app.enableCors({
      origin: appConfig.corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-Id'],
      maxAge: 86_400,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(translateValidationErrors(errors)),
    }),
  );

  if (appConfig.swaggerEnabled) {
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
  }

  await app.listen(appConfig.port);

  const baseUrl = `http://localhost:${appConfig.port}`;
  const docsSuffix = appConfig.swaggerEnabled ? `, docs em ${baseUrl}/docs` : '';
  logger.log(
    `Message Hub iniciado e pronto para receber requisicoes em ${baseUrl} (health em ${baseUrl}/health${docsSuffix})`,
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
