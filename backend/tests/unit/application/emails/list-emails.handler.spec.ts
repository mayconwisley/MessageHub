import { Application } from '@modules/applications/domain/entities/application.entity';
import { IApplicationRepository } from '@modules/applications/domain/repositories/application.repository.interface';
import { EmailMessage } from '@modules/emails/domain/entities/email-message.entity';
import { ListEmailsHandler } from '@modules/emails/application/handlers/list-emails.handler';
import { ListEmailsQuery } from '@modules/emails/application/queries/list-emails.query';
import {
  IEmailMessageRepository,
  ListEmailsFilter,
} from '@modules/emails/domain/repositories/email-message.repository.interface';
import { UniqueId } from '@shared/domain';
import { PaginatedResult } from '@shared/types';

function expectOk<T>(result: { isFailure: boolean; value: T; error: unknown }): T {
  if (result.isFailure) throw new Error(`Expected success but got ${JSON.stringify(result.error)}`);
  return result.value;
}

class FakeApplicationRepository implements IApplicationRepository {
  constructor(private readonly application: Application | null) {}
  async save(): Promise<void> {}
  async findById(): Promise<Application | null> {
    return this.application;
  }
  async listByTenantId(): Promise<PaginatedResult<Application>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeEmailMessageRepository implements IEmailMessageRepository {
  receivedFilter?: ListEmailsFilter;
  constructor(private readonly result: PaginatedResult<EmailMessage>) {}
  async save(): Promise<void> {}
  async findById(): Promise<EmailMessage | null> {
    return null;
  }
  async findByIdempotencyKey(): Promise<EmailMessage | null> {
    return null;
  }
  async listByApplicationId(
    _applicationId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListEmailsFilter,
  ): Promise<PaginatedResult<EmailMessage>> {
    this.receivedFilter = filter;
    return { ...this.result, page, pageSize };
  }
}

describe('ListEmailsHandler', () => {
  const tenantId = UniqueId.create();
  const application = expectOk(Application.create({ tenantId, name: 'Notifications' }));

  it('lists e-mails mapeados e encaminha filtros para o repositório', async () => {
    const email = expectOk(
      EmailMessage.create({
        tenantId,
        applicationId: application.id,
        to: 'cliente@example.com',
        subject: 'Confirmação',
        textBody: 'Seu pedido foi confirmado.',
      }),
    );
    const emails = new FakeEmailMessageRepository({
      items: [email],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    const handler = new ListEmailsHandler(emails, new FakeApplicationRepository(application));

    const result = await handler.execute(
      new ListEmailsQuery(application.id.value, 2, 10, undefined, 'cliente', tenantId.value),
    );

    const page = expectOk(result);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: email.id.value,
      to: 'cliente@example.com',
      subject: 'Confirmação',
    });
    expect(emails.receivedFilter).toEqual({ status: undefined, search: 'cliente' });
    expect(page).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });

  it('does not reveal e-mails when the application belongs to another tenant', async () => {
    const emails = new FakeEmailMessageRepository({ items: [], total: 0, page: 1, pageSize: 20 });
    const handler = new ListEmailsHandler(emails, new FakeApplicationRepository(application));

    const result = await handler.execute(
      new ListEmailsQuery(
        application.id.value,
        1,
        20,
        undefined,
        undefined,
        UniqueId.create().value,
      ),
    );

    expect(result.isFailure).toBe(true);
    expect(result.error.code).toBe('APPLICATION_NOT_FOUND');
    expect(emails.receivedFilter).toBeUndefined();
  });
});
