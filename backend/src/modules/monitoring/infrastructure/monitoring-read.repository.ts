import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationOrmEntity } from '@modules/applications/infrastructure/entities/application.orm-entity';
import { ApiKeyOrmEntity } from '@modules/applications/infrastructure/entities/api-key.orm-entity';
import { MessageOrmEntity } from '@modules/messages/infrastructure/entities/message.orm-entity';
import { PhoneNumberOrmEntity } from '@modules/phone-numbers/infrastructure/entities/phone-number.orm-entity';
import { WhatsAppAccountOrmEntity } from '@modules/whatsapp-accounts/infrastructure/entities/whatsapp-account.orm-entity';
import {
  IMonitoringReadRepository,
  IntegrationMonitorDto,
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
  ) {}
  async getIntegrationMonitor(applicationId: string): Promise<IntegrationMonitorDto | null> {
    const application = await this.applications.findOne({ where: { id: applicationId } });
    if (!application) return null;
    const now = Date.now();
    const minute = new Date(now - 60_000);
    const day = new Date(now - 86_400_000);
    const [usedLastMinute, usedLastDay, keys, messages, phoneRows] = await Promise.all([
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
      this.messages.find({ where: { applicationId }, order: { createdAt: 'DESC' }, take: 10000 }),
      this.phones
        .createQueryBuilder('p')
        .innerJoin(WhatsAppAccountOrmEntity, 'a', 'a.id = p.whatsapp_account_id')
        .innerJoin('app.application_phone_number_links', 'l', 'l.phone_number_id = p.id')
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
    const final = messages.filter((message) =>
      ['SENT', 'DELIVERED', 'READ', 'FAILED'].includes(message.status),
    );
    const failed = final.filter((message) => message.status === 'FAILED').length;
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
        sentLast24Hours: final.length - failed,
        failedLast24Hours: failed,
        failureRate: final.length ? Math.round((failed / final.length) * 1000) / 10 : 0,
      },
    };
  }
}
