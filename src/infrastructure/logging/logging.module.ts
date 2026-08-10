import type { IncomingMessage, ServerResponse } from 'http';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { REQUEST_ID_HEADER } from '@shared/constants';
import { AppConfigService } from '../configuration/app-config.service';
import { ConfigurationModule } from '../configuration/configuration.module';
import { PINO_REDACT_PATHS } from './pino-redact-paths.constant';
import { resolveRequestId } from './resolve-request-id.util';
import { shouldIgnoreRequestLog } from './should-ignore-request-log.util';

interface RequestWithAuthContext extends IncomingMessage {
  authContext?: { tenantId?: string; applicationId?: string };
}

/**
 * Centraliza logging estruturado (JSON em producao, colorido em dev) com
 * correlation id (`x-request-id`), redaction de secrets (secao 27) e sem
 * ruido de health checks/docs (secao 26). Substitui o logger padrao do Nest
 * via `app.useLogger` em `main.ts`.
 */
@Module({
  imports: [
    ConfigurationModule,
    LoggerModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) => ({
        pinoHttp: {
          level: appConfig.isTest ? 'silent' : appConfig.logLevel,
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
            res.setHeader(REQUEST_ID_HEADER, requestId);
            return requestId;
          },
          autoLogging: {
            ignore: (req: IncomingMessage) => shouldIgnoreRequestLog(req.url),
          },
          redact: {
            paths: PINO_REDACT_PATHS,
            censor: '[REDACTED]',
          },
          serializers: {
            req: (req: { id: unknown; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          customProps: (req: RequestWithAuthContext) => {
            const authContext = req.authContext;
            return authContext
              ? { tenantId: authContext.tenantId, applicationId: authContext.applicationId }
              : {};
          },
          transport: appConfig.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: { colorize: true, singleLine: true, translateTime: 'HH:MM:ss.l' },
              },
        },
      }),
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
