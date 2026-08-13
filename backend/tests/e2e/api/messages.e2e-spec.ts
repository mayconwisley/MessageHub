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
import { PlatformAdminOrApiKeyGuard } from '@presentation/http/guards/platform-admin-or-api-key.guard';
import { TenantApiKeyGuard } from '@presentation/http/guards/tenant-api-key.guard';
import { IdentityService } from '@modules/identity/infrastructure/services/identity.service';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { CreateApiKeyHandler } from '@modules/applications/application/handlers/create-api-key.handler';
import { CreateApplicationHandler } from '@modules/applications/application/handlers/create-application.handler';
import { ValidateApiKeyHandler } from '@modules/applications/application/handlers/validate-api-key.handler';
import { ApiKeyGeneratorService } from '@modules/applications/application/services/api-key-generator.service';
import { API_KEY_REPOSITORY } from '@modules/applications/domain/repositories/api-key.repository.interface';
import { APPLICATION_REPOSITORY } from '@modules/applications/domain/repositories/application.repository.interface';
import { ApiKeysController } from '@modules/applications/presentation/controllers/api-keys.controller';
import { ApplicationsController } from '@modules/applications/presentation/controllers/applications.controller';
import { GetMessageHandler } from '@modules/messages/application/handlers/get-message.handler';
import { SendMessageHandler } from '@modules/messages/application/handlers/send-message.handler';
import { MESSAGE_PUBLISHER } from '@modules/messages/application/ports/message-publisher.interface';
import { MESSAGE_TIMELINE_REPOSITORY } from '@modules/messages/application/ports/message-timeline.repository.interface';
import { ApplicationQuotaService } from '@modules/messages/application/services/application-quota.service';
import { MESSAGE_REPOSITORY } from '@modules/messages/domain/repositories/message.repository.interface';
import { MESSAGE_ATTEMPT_REPOSITORY } from '@modules/messages/domain/repositories/message-attempt.repository.interface';
import { MessagesController } from '@modules/messages/presentation/controllers/messages.controller';
import { RegisterPhoneNumberHandler } from '@modules/phone-numbers/application/handlers/register-phone-number.handler';
import { PHONE_NUMBER_REPOSITORY } from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { PhoneNumbersController } from '@modules/phone-numbers/presentation/controllers/phone-numbers.controller';
import { CreateTenantHandler } from '@modules/tenants/application/handlers/create-tenant.handler';
import { TENANT_REPOSITORY } from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { TenantsController } from '@modules/tenants/presentation/controllers/tenants.controller';
import { RegisterWhatsAppAccountHandler } from '@modules/whatsapp-accounts/application/handlers/register-whatsapp-account.handler';
import { WHATSAPP_ACCOUNT_REPOSITORY } from '@modules/whatsapp-accounts/domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountsController } from '@modules/whatsapp-accounts/presentation/controllers/whatsapp-accounts.controller';

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
    async findByIdempotencyKey(): Promise<TEntity | null> {
      return null;
    },
    async recordUsage(): Promise<void> {
      return undefined;
    },
  };
}

describe('Messages flow (e2e)', () => {
  let app: INestApplication;
  const messagePublisher = { publishMessageRequested: jest.fn().mockResolvedValue(undefined) };
  const messageTimelineRepository = { record: jest.fn().mockResolvedValue(undefined) };
  const applicationQuotaService = {
    assertCanAcceptMessage: jest.fn().mockResolvedValue(undefined),
  };
  const adminSession = 'mh_session_e2e-test-token';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CqrsModule, LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [
        TenantsController,
        ApplicationsController,
        ApiKeysController,
        WhatsAppAccountsController,
        PhoneNumbersController,
        MessagesController,
      ],
      providers: [
        { provide: MEDIATOR, useClass: Mediator },
        { provide: TENANT_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: APPLICATION_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: API_KEY_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: WHATSAPP_ACCOUNT_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: PHONE_NUMBER_REPOSITORY, useValue: createInMemoryRepository() },
        { provide: MESSAGE_REPOSITORY, useValue: createInMemoryRepository() },
        {
          provide: MESSAGE_ATTEMPT_REPOSITORY,
          useValue: { findLatestByMessageId: jest.fn().mockResolvedValue(null) },
        },
        { provide: MESSAGE_PUBLISHER, useValue: messagePublisher },
        { provide: MESSAGE_TIMELINE_REPOSITORY, useValue: messageTimelineRepository },
        { provide: ApplicationQuotaService, useValue: applicationQuotaService },
        ApiKeyGeneratorService,
        ApiKeyAuthGuard,
        TenantApiKeyGuard,
        PlatformAdminOrTenantApiKeyGuard,
        PlatformAdminOrApiKeyGuard,
        UserSessionAuthGuard,
        PlatformAdminGuard,
        {
          provide: IdentityService,
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
        RegisterWhatsAppAccountHandler,
        RegisterPhoneNumberHandler,
        SendMessageHandler,
        GetMessageHandler,
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

  it('sends a message end-to-end through tenant/application/api-key/account/phone-number setup', async () => {
    const server = app.getHttpServer();

    const tenant = await request(server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ name: 'Acme Corp' })
      .expect(201);

    const application = await request(server)
      .post('/v1/applications')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ tenantId: tenant.body.id, name: 'Order Notifications' })
      .expect(201);

    const apiKey = await request(server)
      .post(`/v1/applications/${application.body.id}/api-keys`)
      .set('Authorization', `Bearer ${adminSession}`)
      .send({})
      .expect(201);

    const tenantApiKey = await request(server)
      .post(`/v1/applications/${application.body.id}/api-keys`)
      .set('Authorization', `Bearer ${adminSession}`)
      .send({ type: 'tenant' })
      .expect(201);

    const adminWhatsAppAccount = await request(server)
      .post('/v1/whatsapp-accounts')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({
        tenantId: tenant.body.id,
        wabaId: 'waba-admin-managed',
        credentialSource: 'tenant',
        accessToken: 'meta-access-token-admin-managed',
      })
      .expect(201);

    await request(server)
      .post('/v1/phone-numbers')
      .set('Authorization', `Bearer ${adminSession}`)
      .send({
        whatsAppAccountId: adminWhatsAppAccount.body.id,
        phoneNumberId: 'meta-phone-admin-managed',
        displayNumber: '+5511977777777',
      })
      .expect(201);

    const whatsAppAccount = await request(server)
      .post('/v1/whatsapp-accounts')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .send({
        wabaId: 'waba-1',
        credentialSource: 'tenant',
        accessToken: 'meta-access-token',
      })
      .expect(201);

    const phoneNumber = await request(server)
      .post('/v1/phone-numbers')
      .set('Authorization', `Bearer ${tenantApiKey.body.plainTextKey}`)
      .send({
        whatsAppAccountId: whatsAppAccount.body.id,
        phoneNumberId: 'meta-phone-1',
        displayNumber: '+5511999999999',
      })
      .expect(201);

    const sendResponse = await request(server)
      .post('/v1/messages')
      .set('Authorization', `Bearer ${apiKey.body.plainTextKey}`)
      .send({ phoneNumberId: phoneNumber.body.id, to: '+5511988888888', content: 'Ola!' })
      .expect(201);

    expect(sendResponse.body.status).toBe('PENDING');
    expect(messagePublisher.publishMessageRequested).toHaveBeenCalledWith({
      messageId: sendResponse.body.id,
    });

    const getResponse = await request(server)
      .get(`/v1/messages/${sendResponse.body.id}`)
      .set('Authorization', `Bearer ${apiKey.body.plainTextKey}`)
      .expect(200);

    expect(getResponse.body.id).toBe(sendResponse.body.id);
  });

  it('rejects sending a message without a valid API key', async () => {
    await request(app.getHttpServer())
      .post('/v1/messages')
      .send({ phoneNumberId: 'irrelevant', to: '+5511988888888', content: 'Ola!' })
      .expect(401);
  });
});
