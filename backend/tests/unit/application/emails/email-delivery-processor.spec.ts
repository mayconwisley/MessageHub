import { PinoLogger } from 'nestjs-pino';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';
import { SmtpConfigurationNotFoundError } from '@modules/email-configurations/domain/errors/smtp-configuration-not-found.error';
import {
  ResolvedSmtpConfiguration,
  SmtpConnectionSettings,
} from '@modules/email-configurations/application/ports/smtp-configuration-resolver.interface';
import { EmailMessage } from '@modules/emails/domain/entities/email-message.entity';
import { EmailAttempt } from '@modules/emails/domain/entities/email-attempt.entity';
import { EmailAttemptStatus } from '@modules/emails/domain/enums/email-attempt-status.enum';
import { EmailStatus } from '@modules/emails/domain/enums/email-status.enum';
import { EmailDeliveryRejectedError } from '@modules/emails/domain/errors/email-delivery-rejected.error';
import { SmtpProviderUnavailableError } from '@modules/emails/domain/errors/smtp-provider-unavailable.error';
import { IEmailAttemptRepository } from '@modules/emails/domain/repositories/email-attempt.repository.interface';
import { IEmailMessageRepository } from '@modules/emails/domain/repositories/email-message.repository.interface';
import {
  EmailDeliveryError,
  EmailProviderResult,
  IEmailProvider,
  OutgoingEmail,
} from '@modules/emails/application/ports/email-provider.interface';
import {
  EmailRequestedPayload,
  IEmailPublisher,
} from '@modules/emails/application/ports/email-publisher.interface';
import {
  IEmailTimelineRepository,
  RecordEmailTimelineEventInput,
} from '@modules/emails/application/ports/email-timeline.repository.interface';
import { EmailDeliveryProcessor } from '@modules/emails/application/services/email-delivery-processor.service';
import { EmailRetryPolicy } from '@modules/emails/application/services/email-retry-policy';
import { NewOutboxEvent } from '@shared/outbox';

function expectOk<T>(result: Result<T, unknown>): T {
  if (result.isFailure) {
    throw new Error(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

const sampleSmtpSettings: SmtpConnectionSettings = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  username: 'no-reply@example.com',
  password: 'super-secret',
  fromEmail: 'no-reply@example.com',
  fromName: 'Example',
};

class FakeEmailMessageRepository implements IEmailMessageRepository {
  readonly saved: EmailMessage[] = [];
  readonly deliveryOutcomes: Array<{
    email: EmailMessage;
    attempt: EmailAttempt;
    events?: NewOutboxEvent | NewOutboxEvent[];
  }> = [];
  saveDeliveryOutcome?: (
    email: EmailMessage,
    attempt: EmailAttempt,
    events?: NewOutboxEvent | NewOutboxEvent[],
  ) => Promise<void>;

  constructor(
    private readonly email: EmailMessage | null,
    persistDeliveryOutcomesAtomically = false,
  ) {
    if (persistDeliveryOutcomesAtomically) {
      this.saveDeliveryOutcome = async (entity, attempt, events) => {
        this.deliveryOutcomes.push({ email: entity, attempt, events });
      };
    }
  }
  async save(email: EmailMessage): Promise<void> {
    this.saved.push(email);
  }
  async findById(): Promise<EmailMessage | null> {
    return this.email;
  }
  async findByIdempotencyKey(): Promise<EmailMessage | null> {
    return null;
  }
  async listByApplicationId(): Promise<import('@shared/types').PaginatedResult<EmailMessage>> {
    return { items: [], total: 0, page: 1, pageSize: 20 };
  }
}

class FakeEmailAttemptRepository implements IEmailAttemptRepository {
  readonly saved: EmailAttempt[] = [];
  async save(attempt: EmailAttempt): Promise<void> {
    this.saved.push(attempt);
  }
}

class FakeSmtpConfigurationResolver {
  constructor(
    private readonly result: Result<ResolvedSmtpConfiguration, SmtpConfigurationNotFoundError>,
  ) {}
  async resolve(): Promise<Result<ResolvedSmtpConfiguration, SmtpConfigurationNotFoundError>> {
    return this.result;
  }
}

class FakeEmailProvider implements IEmailProvider {
  readonly calls: OutgoingEmail[] = [];
  constructor(private readonly result: Result<EmailProviderResult, EmailDeliveryError>) {}
  async send(email: OutgoingEmail): Promise<Result<EmailProviderResult, EmailDeliveryError>> {
    this.calls.push(email);
    return this.result;
  }
}

class FakeEmailPublisher implements IEmailPublisher {
  readonly published: EmailRequestedPayload[] = [];
  readonly deadLettered: EmailRequestedPayload[] = [];
  async publishEmailRequested(payload: EmailRequestedPayload): Promise<void> {
    this.published.push(payload);
  }
  async publishToDeadLetterQueue(payload: EmailRequestedPayload): Promise<void> {
    this.deadLettered.push(payload);
  }
}

class FakeEmailTimelineRepository implements IEmailTimelineRepository {
  readonly recorded: RecordEmailTimelineEventInput[] = [];
  async record(input: RecordEmailTimelineEventInput): Promise<void> {
    this.recorded.push(input);
  }
  async listByEmailMessageId() {
    return [];
  }
}

const fakeLogger = {
  setContext: () => undefined,
  warn: () => undefined,
  error: () => undefined,
} as unknown as PinoLogger;

function buildProcessor(options: {
  email: EmailMessage | null;
  configurationResult?: Result<ResolvedSmtpConfiguration, SmtpConfigurationNotFoundError>;
  providerResult?: Result<EmailProviderResult, EmailDeliveryError>;
  includeOptionalDeps?: boolean;
  persistDeliveryOutcomesAtomically?: boolean;
}) {
  const {
    email,
    configurationResult = Result.ok({ settings: sampleSmtpSettings, source: 'tenant' }),
    providerResult = Result.ok({ providerMessageId: 'provider-message-1' }),
    includeOptionalDeps = true,
    persistDeliveryOutcomesAtomically = false,
  } = options;

  const attemptRepository = new FakeEmailAttemptRepository();
  const publisher = new FakeEmailPublisher();
  const provider = new FakeEmailProvider(providerResult);
  const timeline = includeOptionalDeps ? new FakeEmailTimelineRepository() : undefined;
  const alerts = includeOptionalDeps
    ? { notify: jest.fn().mockResolvedValue(undefined) }
    : undefined;

  const emailRepository = new FakeEmailMessageRepository(email, persistDeliveryOutcomesAtomically);
  const processor = new EmailDeliveryProcessor(
    emailRepository,
    attemptRepository,
    new FakeSmtpConfigurationResolver(configurationResult),
    provider,
    publisher,
    new EmailRetryPolicy(),
    fakeLogger,
    timeline,
    alerts as unknown as EngineeringAlertService | undefined,
  );

  return { processor, emailRepository, attemptRepository, publisher, provider, timeline, alerts };
}

describe('EmailDeliveryProcessor', () => {
  const tenantId = UniqueId.create();
  const applicationId = UniqueId.create();

  function buildPendingEmail() {
    return expectOk(
      EmailMessage.create({
        tenantId,
        applicationId,
        to: 'cliente@example.com',
        subject: 'Pedido confirmado',
        textBody: 'Seu pedido foi confirmado.',
      }),
    );
  }

  function eventTypes(timeline: FakeEmailTimelineRepository) {
    return timeline.recorded.map((event) => event.eventType);
  }

  it('marks the email as SENT, saves a SUCCEEDED attempt and records timeline events on success', async () => {
    const email = buildPendingEmail();
    const { processor, emailRepository, attemptRepository, publisher, timeline, alerts } =
      buildProcessor({
        email,
      });

    await processor.process(email.id.value);

    expect(email.status).toBe(EmailStatus.SENT);
    expect(email.providerMessageId).toBe('provider-message-1');
    expect(emailRepository.saved).toContain(email);
    expect(attemptRepository.saved).toHaveLength(1);
    expect(attemptRepository.saved[0].status).toBe(EmailAttemptStatus.SUCCEEDED);
    expect(publisher.deadLettered).toHaveLength(0);
    expect(publisher.published).toHaveLength(0);
    expect(eventTypes(timeline!)).toEqual([
      'DELIVERY_ATTEMPT_STARTED',
      'PROVIDER_ACCEPTED_MESSAGE',
    ]);
    expect(alerts!.notify).not.toHaveBeenCalled();
  });

  it('persiste mensagem e tentativa pelo contrato atômico quando o repositório o suporta', async () => {
    const email = buildPendingEmail();
    const { processor, emailRepository, attemptRepository } = buildProcessor({
      email,
      persistDeliveryOutcomesAtomically: true,
    });

    await processor.process(email.id.value);

    expect(emailRepository.deliveryOutcomes).toEqual([
      expect.objectContaining({
        email,
        attempt: expect.objectContaining({ status: EmailAttemptStatus.SUCCEEDED }),
      }),
    ]);
    expect(attemptRepository.saved).toHaveLength(0);
  });

  it('sends the email straight to the DLQ when SMTP configuration resolution fails (non-retryable)', async () => {
    const email = buildPendingEmail();
    const { processor, attemptRepository, publisher, provider, timeline, alerts } = buildProcessor({
      email,
      configurationResult: Result.fail(new SmtpConfigurationNotFoundError()),
    });

    await processor.process(email.id.value);

    expect(email.status).toBe(EmailStatus.FAILED);
    expect(provider.calls).toHaveLength(0);
    expect(attemptRepository.saved).toHaveLength(1);
    expect(attemptRepository.saved[0].status).toBe(EmailAttemptStatus.FAILED);
    expect(attemptRepository.saved[0].errorCode).toBe('SMTP_CONFIGURATION_NOT_FOUND');
    expect(publisher.deadLettered).toEqual([{ emailMessageId: email.id.value }]);
    expect(publisher.published).toHaveLength(0);
    expect(eventTypes(timeline!)).toEqual([
      'DELIVERY_ATTEMPT_STARTED',
      'DELIVERY_ATTEMPT_FAILED',
      'DELIVERY_SENT_TO_DLQ',
    ]);
    expect(alerts!.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EMAIL_DLQ',
        severity: 'CRITICAL',
        metadata: expect.objectContaining({
          emailMessageId: email.id.value,
          applicationId: applicationId.value,
          errorCode: 'SMTP_CONFIGURATION_NOT_FOUND',
        }),
      }),
    );
  });

  it('schedules a retry through the publisher when the provider fails with a retryable error', async () => {
    jest.useFakeTimers();
    try {
      const email = buildPendingEmail();
      const { processor, publisher, timeline } = buildProcessor({
        email,
        providerResult: Result.fail(new SmtpProviderUnavailableError('timeout')),
      });

      await processor.process(email.id.value);

      expect(email.status).toBe(EmailStatus.RETRY);
      expect(publisher.published).toHaveLength(0);
      expect(eventTypes(timeline!)).toEqual([
        'DELIVERY_ATTEMPT_STARTED',
        'DELIVERY_ATTEMPT_FAILED',
        'RETRY_SCHEDULED',
      ]);

      await jest.runAllTimersAsync();

      expect(publisher.published).toEqual([{ emailMessageId: email.id.value }]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('sends to the DLQ with an alert when the provider fails with a non-retryable error', async () => {
    const email = buildPendingEmail();
    const { processor, attemptRepository, publisher, timeline, alerts } = buildProcessor({
      email,
      providerResult: Result.fail(new EmailDeliveryRejectedError('rejected by provider')),
    });

    await processor.process(email.id.value);

    expect(email.status).toBe(EmailStatus.FAILED);
    expect(attemptRepository.saved[0].errorCode).toBe('EMAIL_DELIVERY_REJECTED');
    expect(publisher.deadLettered).toEqual([{ emailMessageId: email.id.value }]);
    expect(publisher.published).toHaveLength(0);
    expect(eventTypes(timeline!)).toEqual([
      'DELIVERY_ATTEMPT_STARTED',
      'DELIVERY_ATTEMPT_FAILED',
      'DELIVERY_SENT_TO_DLQ',
    ]);
    expect(alerts!.notify).toHaveBeenCalledTimes(1);
  });

  it('sends to the DLQ once retries are exhausted, even for a retryable error', async () => {
    const email = buildPendingEmail();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      email.markProcessing();
      email.markFailed();
      email.scheduleRetry();
    }
    expect(email.attemptCount).toBe(3);
    expect(email.status).toBe(EmailStatus.RETRY);

    const { processor, publisher, timeline, alerts } = buildProcessor({
      email,
      providerResult: Result.fail(new SmtpProviderUnavailableError('still down')),
    });

    await processor.process(email.id.value);

    expect(email.attemptCount).toBe(4);
    expect(email.status).toBe(EmailStatus.FAILED);
    expect(publisher.deadLettered).toEqual([{ emailMessageId: email.id.value }]);
    expect(publisher.published).toHaveLength(0);
    expect(eventTypes(timeline!)).toEqual([
      'DELIVERY_ATTEMPT_STARTED',
      'DELIVERY_ATTEMPT_FAILED',
      'DELIVERY_SENT_TO_DLQ',
    ]);
    expect(alerts!.notify).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the optional timeline and alerts dependencies are not provided', async () => {
    const email = buildPendingEmail();
    const { processor, publisher } = buildProcessor({
      email,
      providerResult: Result.fail(new EmailDeliveryRejectedError('rejected')),
      includeOptionalDeps: false,
    });

    await expect(processor.process(email.id.value)).resolves.toBeUndefined();
    expect(email.status).toBe(EmailStatus.FAILED);
    expect(publisher.deadLettered).toEqual([{ emailMessageId: email.id.value }]);
  });

  it('does nothing when the email message is not found', async () => {
    const { processor, publisher, attemptRepository } = buildProcessor({ email: null });

    await processor.process(UniqueId.create().value);

    expect(publisher.published).toHaveLength(0);
    expect(publisher.deadLettered).toHaveLength(0);
    expect(attemptRepository.saved).toHaveLength(0);
  });

  it('does nothing when the email is not in a processable state', async () => {
    const email = buildPendingEmail();
    email.markProcessing();
    email.markSent('already-sent-id');
    const { processor, publisher, attemptRepository } = buildProcessor({ email });

    await processor.process(email.id.value);

    expect(publisher.published).toHaveLength(0);
    expect(publisher.deadLettered).toHaveLength(0);
    expect(attemptRepository.saved).toHaveLength(0);
  });
});
