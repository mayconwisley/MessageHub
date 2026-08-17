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
import { PlatformAdminOrTenantApiKeyGuard } from '@presentation/http/guards/platform-admin-or-tenant-api-key.guard';
import { TenantApiKeyGuard } from '@presentation/http/guards/tenant-api-key.guard';
import { UserSessionService } from '@modules/identity/application/services/user-session.service';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { SmtpConfigService } from '@infrastructure/configuration/smtp-config.service';
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
import { ConfigureEmailSmtpHandler } from '@modules/email-configurations/application/handlers/configure-email-smtp.handler';
import { GetEmailSmtpConfigurationHandler } from '@modules/email-configurations/application/handlers/get-email-smtp-configuration.handler';
import { RemoveEmailSmtpHandler } from '@modules/email-configurations/application/handlers/remove-email-smtp.handler';
import { EMAIL_SMTP_CONFIGURATION_REPOSITORY } from '@modules/email-configurations/domain/repositories/email-smtp-configuration.repository.interface';
import { EmailSmtpConfigurationsController } from '@modules/email-configurations/presentation/controllers/email-smtp-configurations.controller';

/** Repositorio in-memory generico, usado apenas neste teste para isolar a API de Postgres real. */
function createInMemoryRepository<TEntity extends { id: { value: string } }>() {
  const store = new Map<string, TEntity>();
  return {
    async save(entity: TEntity): Promise<void> {
      store.set(entity.id.value, entity);
    },
    async findById(id: { value: string }): Promise<TEntity | null> {
      return store.get(id.value) ?? null;
    },
    async recordUsage(): Promise<void> {
      return undefined;
    },
  };
}

/** Repositorio in-memory da configuração SMTP por tenant, usado apenas neste teste. */
function createInMemorySmtpConfigurationRepository() {
  const store = new Map<string, { id: { value: string }; tenantId: { value: string } }>();
  return {
    async save(configuration: { id: { value: string }; tenantId: { value: string } }) {
      store.set(configuration.tenantId.value, configuration);
    },
    async findByTenantId(tenantId: { value: string }) {
      return store.get(tenantId.value) ?? null;
    },
    async delete(configuration: { tenantId: { value: string } }) {
      store.delete(configuration.tenantId.value);
    },
  };
}

describe('Email SMTP configurations flow (e2e)', () => {
  let app: INestApplication;
  const adminSession = 'mh_session_e2e-test-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule, LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [
        TenantsController,
        ApplicationsController,
        ApiKeysController,
        EmailSmtpConfigurationsController,
      ],
      providers: [
        { provide: MEDIATOR, useClass: Mediator },
        { provide: TENANT_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: APPLICATION_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: API_KEY_REPOSITORY, useValue: createInMemoryRepository() },
        {
          provide: EMAIL_SMTP_CONFIGURATION_REPOSITORY,
          useValue: createInMemorySmtpConfigurationRepository(),
        },
        { provide: SmtpConfigService, useValue: { defaultSettings: null } },
        ApiKeyGeneratorService,
        ApiKeyAuthGuard,
        TenantApiKeyGuard,
        PlatformAdminOrTenantApiKeyGuard,
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
        ConfigureEmailSmtpHandler,
        GetEmailSmtpConfigurationHandler,
        RemoveEmailSmtpHandler,
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

  async function setupTenantApiKey(tenantName: string) {
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

    const tenantApiKey = await request(server)
      .post(`/v1/applications/${application.body.id}/api-keys`)
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ type: 'tenant' })
      .expect(201);

    return { tenant, application, tenantApiKey };
  }

  it('reports source "none" when a tenant has no SMTP configuration and there is no default', async () => {
    const server = app.getHttpServer();
    const { tenantApiKey } = await setupTenantApiKey('Acme Corp');

    const response = await request(server)
      .get('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .expect(200);

    expect(response.body.source).toBe('none');
    expect(response.body.host).toBeNull();
  });

  it('configures, retrieves and removes a tenant SMTP configuration end-to-end', async () => {
    const server = app.getHttpServer();
    const { tenantApiKey } = await setupTenantApiKey('Globex Corp');

    const configureResponse = await request(server)
      .put('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .send({
        host: 'smtp.globex.com',
        port: 587,
        secure: false,
        username: 'no-reply@globex.com',
        password: 'super-secret',
        fromEmail: 'no-reply@globex.com',
        fromName: 'Globex Corp',
      })
      .expect(200);

    expect(configureResponse.body.source).toBe('tenant');
    expect(configureResponse.body.host).toBe('smtp.globex.com');
    expect(configureResponse.body.password).toBeUndefined();

    const getResponse = await request(server)
      .get('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .expect(200);

    expect(getResponse.body.host).toBe('smtp.globex.com');
    expect(getResponse.body.fromName).toBe('Globex Corp');

    await request(server)
      .delete('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .expect(204);

    const afterRemoval = await request(server)
      .get('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .expect(200);

    expect(afterRemoval.body.source).toBe('none');
  });

  it('rejects a payload that fails request-level validation', async () => {
    const server = app.getHttpServer();
    const { tenantApiKey } = await setupTenantApiKey('Initech Corp');

    await request(server)
      .put('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .send({
        host: 'smtp.initech.com',
        port: 587,
        secure: false,
        username: 'no-reply@initech.com',
        password: '',
        fromEmail: 'no-reply@initech.com',
        fromName: 'Initech Corp',
      })
      .expect(400);
  });

  it('rejects a payload that fails domain-level validation once it clears request validation', async () => {
    const server = app.getHttpServer();
    const { tenantApiKey } = await setupTenantApiKey('Hooli Corp');

    const response = await request(server)
      .put('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .send({
        host: 'smtp.hooli.com',
        port: 587,
        secure: false,
        username: '   ',
        password: 'super-secret',
        fromEmail: 'no-reply@hooli.com',
        fromName: 'Hooli Corp',
      })
      .expect(400);

    expect(response.body.code).toBe('INVALID_SMTP_CONFIGURATION');
  });

  it('rejects requests made with a platform (non-tenant) API key', async () => {
    const server = app.getHttpServer();
    const tenant = await request(server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ name: 'Umbrella Corp' })
      .expect(201);

    const application = await request(server)
      .post('/v1/applications')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ tenantId: tenant.body.id, name: 'Notifications' })
      .expect(201);

    const platformApiKey = await request(server)
      .post(`/v1/applications/${application.body.id}/api-keys`)
      .set('Authorization', `Bearer ${adminSession}`)
      .send({})
      .expect(201);

    await request(server)
      .get('/v1/email-configurations/smtp')
      .set('Authorization', `Bearer ${platformApiKey.body.plainTextKey}`)
      .expect(401);
  });

  it('rejects a request without any authentication', async () => {
    await request(app.getHttpServer()).get('/v1/email-configurations/smtp').expect(401);
  });
});
