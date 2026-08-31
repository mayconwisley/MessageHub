import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOrmEntity } from '@modules/applications/infrastructure/entities/application.orm-entity';
import { ApiKeyOrmEntity } from '@modules/applications/infrastructure/entities/api-key.orm-entity';
import { ApplicationPhoneNumberLinkOrmEntity } from '@modules/applications/infrastructure/entities/application-phone-number-link.orm-entity';
import { MessageOrmEntity } from '@modules/messages/infrastructure/entities/message.orm-entity';
import { PhoneNumberOrmEntity } from '@modules/phone-numbers/infrastructure/entities/phone-number.orm-entity';
import { WhatsAppAccountOrmEntity } from '@modules/whatsapp-accounts/infrastructure/entities/whatsapp-account.orm-entity';
import { EmailMessageOrmEntity } from '@modules/emails/infrastructure/entities/email-message.orm-entity';
import { OutboxEventOrmEntity } from '@infrastructure/database/entities/outbox-event.orm-entity';
import {
  IMonitoringReadRepository,
  IntegrationMonitorDto,
  OperationalSummaryDto,
} from '../application/ports/monitoring-read.repository.interface';

interface PhoneMonitorRow {
  id: string;
  display_number: string;
  status: string;
  account_id: string;
  account_status: string;
  credential_source: string;
  credential_expires_at: string | null;
}

@Injectable()
export class MonitoringReadRepository implements IMonitoringReadRepository {
  constructor(
    @InjectRepository(ApplicationOrmEntity)
    private readonly applications: Repository<ApplicationOrmEntity>,
    @InjectRepository(ApiKeyOrmEntity) private readonly apiKeys: Repository<ApiKeyOrmEntity>,
    @InjectRepository(MessageOrmEntity) private readonly messages: Repository<MessageOrmEntity>,
    @InjectRepository(PhoneNumberOrmEntity)
    private readonly phones: Repository<PhoneNumberOrmEntity>,
    @InjectRepository(WhatsAppAccountOrmEntity)
    private readonly accounts: Repository<WhatsAppAccountOrmEntity>,
    @InjectRepository(EmailMessageOrmEntity)
    private readonly emails: Repository<EmailMessageOrmEntity>,
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outbox: Repository<OutboxEventOrmEntity>,
  ) {}
  async getOperationalSummary(): Promise<OperationalSummaryDto> {
    const since = new Date(Date.now() - 86_400_000);
    const pendingOutbox = this.outbox
      .createQueryBuilder('event')
      .where('event.processed_at IS NULL')
      .andWhere('event.failed_at IS NULL');
    const [pendingMessages, failedMessages, pendingEmails, failedEmails, pending, failed, oldest] =
      await Promise.all([
        this.messages.count({ where: { status: 'PENDING' } }),
        this.messages
          .createQueryBuilder('message')
          .where("message.status = 'FAILED'")
          .andWhere('message.updated_at >= :since', { since })
          .getCount(),
        this.emails.count({ where: { status: 'PENDING' } }),
        this.emails
          .createQueryBuilder('email')
          .where("email.status = 'FAILED'")
          .andWhere('email.updated_at >= :since', { since })
          .getCount(),
        pendingOutbox.clone().getCount(),
        this.outbox.createQueryBuilder('event').where('event.failed_at IS NOT NULL').getCount(),
        pendingOutbox.orderBy('event.occurred_at', 'ASC').getOne(),
      ]);
    return {
      generatedAt: new Date(),
      messages: { pending: pendingMessages, failedLast24Hours: failedMessages },
      emails: { pending: pendingEmails, failedLast24Hours: failedEmails },
      outbox: { pending, failed, oldestPendingAt: oldest?.occurredAt ?? null },
    };
  }
  async getIntegrationMonitor(applicationId: string): Promise<IntegrationMonitorDto | null> {
    const application = await this.applications.findOne({ where: { id: applicationId } });
    if (!application) return null;
    const now = Date.now();
    const minute = new Date(now - 60_000);
    const day = new Date(now - 86_400_000);
    const [usedLastMinute, usedLastDay, keys, delivery, phoneRows] = await Promise.all([
      this.messages
        .createQueryBuilder('m')
        .where('m.application_id = :applicationId AND m.created_at >= :minute', {
          applicationId,
          minute,
        })
        .getCount(),
      this.messages
        .createQueryBuilder('m')
        .where('m.application_id = :applicationId AND m.created_at >= :day', { applicationId, day })
        .getCount(),
      this.apiKeys.find({ where: { applicationId } }),
      this.messages
        .createQueryBuilder('m')
        .select('m.status', 'status')
        .addSelect('COUNT(*)', 'total')
        .where('m.application_id = :applicationId AND m.created_at >= :day', {
          applicationId,
          day,
        })
        .andWhere("m.status IN ('SENT', 'DELIVERED', 'READ', 'FAILED')")
        .groupBy('m.status')
        .getRawMany<{ status: string; total: string }>(),
      this.phones
        .createQueryBuilder('p')
        .innerJoin(WhatsAppAccountOrmEntity, 'a', 'a.id = p.whatsapp_account_id')
        .innerJoin(ApplicationPhoneNumberLinkOrmEntity, 'l', 'l.phone_number_id = p.id')
        .where('l.application_id = :applicationId', { applicationId })
        .select([
          'p.id AS id',
          'p.display_number AS display_number',
          'p.status AS status',
          'a.id AS account_id',
          'a.status AS account_status',
          'a.credential_source AS credential_source',
          'a.credential_expires_at AS credential_expires_at',
        ])
        .getRawMany<PhoneMonitorRow>(),
    ]);
    const final = delivery.reduce((total, item) => total + Number(item.total), 0);
    const failed = delivery
      .filter((item) => item.status === 'FAILED')
      .reduce((total, item) => total + Number(item.total), 0);
    const quotaRatio = Math.max(
      usedLastMinute / application.quotaPerMinute,
      usedLastDay / application.quotaPerDay,
    );
    return {
      application: {
        id: application.id,
        name: application.name,
        status: application.status,
        quotaPerMinute: application.quotaPerMinute,
        quotaPerDay: application.quotaPerDay,
        usedLastMinute,
        usedLastDay,
        quotaStatus: quotaRatio >= 1 ? 'EXCEEDED' : quotaRatio >= 0.8 ? 'WARNING' : 'HEALTHY',
      },
      apiKeys: keys.map((key) => {
        const expiresInDays = key.expiresAt
          ? Math.floor((key.expiresAt.getTime() - now) / 86_400_000)
          : null;
        return {
          id: key.id,
          prefix: key.prefix,
          status: key.status,
          expiresAt: key.expiresAt,
          expiresInDays,
          lastUsedAt: key.lastUsedAt,
          health:
            key.status !== 'ACTIVE'
              ? 'REVOKED'
              : expiresInDays !== null && expiresInDays < 0
                ? 'EXPIRED'
                : expiresInDays !== null && expiresInDays <= 14
                  ? 'EXPIRING'
                  : 'HEALTHY',
        };
      }),
      phoneNumbers: phoneRows.map((phone) => {
        const credentialExpiresAt = phone.credential_expires_at
          ? new Date(phone.credential_expires_at)
          : null;
        const credentialDays = credentialExpiresAt
          ? Math.floor((credentialExpiresAt.getTime() - now) / 86_400_000)
          : null;
        return {
          id: phone.id,
          displayNumber: phone.display_number,
          status: phone.status,
          whatsAppAccountId: phone.account_id,
          accountStatus: phone.account_status,
          credentialSource: phone.credential_source,
          credentialExpiresAt,
          credentialHealth:
            credentialDays === null
              ? 'NOT_INFORMED'
              : credentialDays < 0
                ? 'EXPIRED'
                : credentialDays <= 14
                  ? 'EXPIRING'
                  : 'HEALTHY',
          health:
            phone.status === 'ACTIVE' && phone.account_status === 'ACTIVE' ? 'HEALTHY' : 'INACTIVE',
        };
      }),
      delivery: {
        sentLast24Hours: final - failed,
        failedLast24Hours: failed,
        failureRate: final ? Math.round((failed / final) * 1000) / 10 : 0,
      },
    };
  }
}
