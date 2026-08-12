import { Logger as NestLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './infrastructure/configuration/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

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

  const appConfig = app.get(AppConfigService);
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
