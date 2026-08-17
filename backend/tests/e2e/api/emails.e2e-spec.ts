import { INestApplication, ValidationPipe } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { MEDIATOR, Mediator } from '@shared/mediator';
import { GlobalExceptionFilter } from '@presentation/http/filters/global-exception.filter';
import { ApiKeyAuthGuard } from '@presentation/http/guards/api-key-auth.guard';
import { UserSessionAuthGuard } from '@presentation/http/guards/user-session-auth.guard';
import { PlatformAdminGuard } from '@presentation/http/guards/platform-admin.guard';
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { CreateApiKeyHandler } from '@modules/applications/application/handlers/create-api-key.handler';
import { CreateApplicationHandler } from '@modules/applications/application/handlers/create-application.handler';
import { ValidateApiKeyHandler } from '@modules/applications/application/handlers/validate-api-key.handler';
import { ApiKeyGeneratorService } from '@modules/applications/application/services/api-key-generator.service';
import { API_KEY_REPOSITORY } from '@modules/applications/domain/repositories/api-key.repository.interface';
import { APPLICATION_REPOSITORY } from '@modules/applications/domain/repositories/application.repository.interface';
import { ApiKeysController } from '@modules/applications/presentation/controllers/api-keys.controller';
import { ApplicationsController } from '@modules/applications/presentation/controllers/applications.controller';
import { CreateTenantHandler } from '@modules/tenants/application/handlers/create-tenant.handler';
import { TENANT_REPOSITORY } from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { TenantsController } from '@modules/tenants/presentation/controllers/tenants.controller';
import { SendEmailHandler } from '@modules/emails/application/handlers/send-email.handler';
import { ListEmailTimelineHandler } from '@modules/emails/application/handlers/list-email-timeline.handler';
import { EMAIL_PUBLISHER } from '@modules/emails/application/ports/email-publisher.interface';
import { EMAIL_TIMELINE_REPOSITORY } from '@modules/emails/application/ports/email-timeline.repository.interface';
import { EMAIL_MESSAGE_REPOSITORY } from '@modules/emails/domain/repositories/email-message.repository.interface';
import { EmailsController } from '@modules/emails/presentation/controllers/emails.controller';

/** Repositorio in-memory generico, usado apenas neste teste para isolar a API de Postgres/RabbitMQ real. */
function createInMemoryRepository<TEntity extends { id: { value: string } }>() {
  const store = new Map<string, TEntity>();
  return {
    async save(entity: TEntity): Promise<void> {
      store.set(entity.id.value, entity);
    },
    async findById(id: { value: string }): Promise<TEntity | null> {
      return store.get(id.value) ?? null;
    },
    async findByIdempotencyKey(applicationId: { value: string }, idempotencyKey: string) {
      for (const entity of store.values()) {
        const candidate = entity as unknown as {
          idempotencyKey?: string | null;
          applicationId?: { value: string };
        };
        if (
          candidate.idempotencyKey === idempotencyKey &&
          candidate.applicationId?.value === applicationId.value
        ) {
          return entity;
        }
      }
      return null;
    },
    async recordUsage(): Promise<void> {
      return undefined;
    },
  };
}

describe('Emails flow (e2e)', () => {
  let app: INestApplication;
  const emailPublisher = {
    publishEmailRequested: jest.fn().mockResolvedValue(undefined),
    publishToDeadLetterQueue: jest.fn().mockResolvedValue(undefined),
  };
  const emailTimelineRepository = {
    record: jest.fn().mockResolvedValue(undefined),
    listByEmailMessageId: jest
      .fn()
      .mockResolvedValue([
        {
          id: 'event-1',
          emailMessageId: 'unused',
          eventType: 'DELIVERY_ATTEMPT_STARTED',
          status: 'PENDING',
          source: 'WORKER',
          occurredAt: new Date(),
        },
      ]),
  };
  const adminSession = 'mh_session_e2e-test-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule, LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [TenantsController, ApplicationsController, ApiKeysController, EmailsController],
      providers: [
        { provide: MEDIATOR, useClass: Mediator },
        { provide: TENANT_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: APPLICATION_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: API_KEY_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: EMAIL_MESSAGE_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: EMAIL_PUBLISHER, useValue: emailPublisher },
        { provide: EMAIL_TIMELINE_REPOSITORY, useValue: emailTimelineRepository },
        ApiKeyGeneratorService,
        ApiKeyAuthGuard,
        PlatformAdminOrApiKeyGuard,
        UserSessionAuthGuard,
        PlatformAdminGuard,
        {
          provide: UserSessionService,
          useValue: {
            resolveSession: jest.fn().mockResolvedValue({
              id: '4f666ed7-c819-4f3e-bcc3-b951c6ed8e2a',
              email: 'admin@example.com',
              role: 'platform_admin',
              tenantId: null,
            }),
          },
        },
        {
          provide: MetaConfigService,
          useValue: { defaultChannelEnabled: false, defaultTenantId: null },
        },
        GlobalExceptionFilter,
        CreateTenantHandler,
        CreateApplicationHandler,
        CreateApiKeyHandler,
        ValidateApiKeyHandler,
        SendEmailHandler,
        ListEmailTimelineHandler,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(app.get(GlobalExceptionFilter));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function setupApplicationWithApiKey(tenantName: string) {
    const server = app.getHttpServer();

    const tenant = await request(server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ name: tenantName })
      .expect(201);

    const application = await request(server)
      .post('/v1/applications')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ tenantId: tenant.body.id, name: 'Notifications' })
      .expect(201);

    const apiKey = await request(server)
      .post(`/v1/applications/${application.body.id}/api-keys`)
      .set('Authorization', `Bearer ${adminSession}`)
      .send({})
      .expect(201);

    return { tenant, application, apiKey };
  }

  it('sends an e-mail end-to-end and exposes its delivery timeline', async () => {
    const server = app.getHttpServer();
    const { apiKey } = await setupApplicationWithApiKey('Acme Corp');

    const sendResponse = await request(server)
      .post('/v1/emails')
      .set('Authorization', `Bearer ${apiKey.body.plainTextKey}`)
      .send({
        to: 'cliente@example.com',
        subject: 'Pedido confirmado',
        textBody: 'Seu pedido foi confirmado.',
      })
      .expect(201);

    expect(sendResponse.body.status).toBe('PENDING');
    expect(sendResponse.body.to).toBe('cliente@example.com');
    expect(emailPublisher.publishEmailRequested).toHaveBeenCalledWith({
      emailMessageId: sendResponse.body.id,
    });

    const timelineResponse = await request(server)
      .get(`/v1/emails/${sendResponse.body.id}/timeline`)
      .set('Authorization', `Bearer ${apiKey.body.plainTextKey}`)
      .expect(200);

    expect(Array.isArray(timelineResponse.body)).toBe(true);
    expect(timelineResponse.body).toHaveLength(1);
  });

  it('rejects an e-mail request missing both textBody and htmlBody', async () => {
    const server = app.getHttpServer();
    const { apiKey } = await setupApplicationWithApiKey('Initech Corp');

    await request(server)
      .post('/v1/emails')
      .set('Authorization', `Bearer ${apiKey.body.plainTextKey}`)
      .send({ to: 'cliente@example.com', subject: 'Sem corpo' })
      .expect(400);
  });

  it('rejects sending an e-mail without a valid API key', async () => {
    await request(app.getHttpServer())
      .post('/v1/emails')
      .send({ to: 'cliente@example.com', subject: 'Pedido confirmado', textBody: 'Ola' })
      .expect(401);
  });

  it('returns a client error when reading the timeline of an e-mail from a different application', async () => {
    const server = app.getHttpServer();
    const { apiKey: firstApiKey } = await setupApplicationWithApiKey('Globex Corp');
    const { apiKey: secondApiKey } = await setupApplicationWithApiKey('Umbrella Corp');

    const sendResponse = await request(server)
      .post('/v1/emails')
      .set('Authorization', `Bearer ${firstApiKey.body.plainTextKey}`)
      .send({
        to: 'cliente@example.com',
        subject: 'Pedido confirmado',
        textBody: 'Seu pedido foi confirmado.',
      })
      .expect(201);

    const response = await request(server)
      .get(`/v1/emails/${sendResponse.body.id}/timeline`)
      .set('Authorization', `Bearer ${secondApiKey.body.plainTextKey}`);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});
