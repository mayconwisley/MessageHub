import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ApplicationOrmEntity } from '@modules/applications/infrastructure/entities/application.orm-entity';
import { MessageOrmEntity } from '@modules/messages/infrastructure/entities/message.orm-entity';
import { PhoneNumberOrmEntity } from '@modules/phone-numbers/infrastructure/entities/phone-number.orm-entity';
import { TenantOrmEntity } from '@modules/tenants/infrastructure/entities/tenant.orm-entity';
import { WhatsAppAccountOrmEntity } from '@modules/whatsapp-accounts/infrastructure/entities/whatsapp-account.orm-entity';
import {
  DashboardDeliveryStatusDto,
  DashboardMessageVolumePointDto,
  DashboardOperationalHealthDto,
  DashboardRecentMessageDto,
  DashboardResourceSummaryDto,
  IDashboardReadRepository,
} from '../../application/ports/dashboard-read.repository.interface';

@Injectable()
export class PostgresDashboardReadRepository implements IDashboardReadRepository {
  constructor(
    @InjectRepository(TenantOrmEntity) private readonly tenants: Repository<TenantOrmEntity>,
    @InjectRepository(ApplicationOrmEntity)
    private readonly applications: Repository<ApplicationOrmEntity>,
    @InjectRepository(WhatsAppAccountOrmEntity)
    private readonly accounts: Repository<WhatsAppAccountOrmEntity>,
    @InjectRepository(PhoneNumberOrmEntity)
    private readonly phoneNumbers: Repository<PhoneNumberOrmEntity>,
    @InjectRepository(MessageOrmEntity) private readonly messages: Repository<MessageOrmEntity>,
  ) {}

  async getResourceSummary(tenantId?: string): Promise<DashboardResourceSummaryDto> {
    const [tenants, applications, whatsAppAccounts, phoneNumbers] = await Promise.all([
      tenantId ? 1 : this.tenants.count(),
      this.applications.count({ where: tenantId ? { tenantId } : {} }),
      this.accounts.count({ where: tenantId ? { tenantId } : {} }),
      this.phoneNumberQuery(tenantId).getCount(),
    ]);
    return { tenants, applications, whatsAppAccounts, phoneNumbers };
  }

  async getMessageVolume(tenantId?: string): Promise<DashboardMessageVolumePointDto[]> {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 13);
    const rows = await this.messageQuery(tenantId)
      .select("TO_CHAR(DATE_TRUNC('day', message.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'messages')
      .andWhere('message.created_at >= :start', { start })
      .groupBy("DATE_TRUNC('day', message.created_at)")
      .orderBy("DATE_TRUNC('day', message.created_at)", 'ASC')
      .getRawMany<{ date: string; messages: string }>();
    const byDate = new Map(rows.map((row) => [row.date, Number(row.messages)]));
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, messages: byDate.get(key) ?? 0 };
    });
  }

  async getDeliveryStatus(tenantId?: string): Promise<DashboardDeliveryStatusDto> {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 30);
    const rows = await this.messageQuery(tenantId)
      .select('message.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .andWhere('message.created_at >= :start', { start })
      .groupBy('message.status')
      .getRawMany<{ status: string; total: string }>();
    const items = rows.map((row) => ({ status: row.status, total: Number(row.total) }));
    return { total: items.reduce((sum, item) => sum + item.total, 0), items };
  }

  async getOperationalHealth(tenantId?: string): Promise<DashboardOperationalHealthDto> {
    const failedSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingMessages, failedLast24Hours, activePhoneNumbers, completed] = await Promise.all([
      this.messageQuery(tenantId)
        .andWhere('message.status IN (:...statuses)', {
          statuses: ['PENDING', 'PROCESSING', 'RETRY'],
        })
        .getCount(),
      this.messageQuery(tenantId)
        .andWhere('message.status = :status', { status: 'FAILED' })
        .andWhere('message.updated_at >= :failedSince', { failedSince })
        .getCount(),
      this.phoneNumberQuery(tenantId)
        .andWhere('phone_number.status = :status', { status: 'ACTIVE' })
        .getCount(),
      this.messageQuery(tenantId)
        .select('message.status', 'status')
        .addSelect('COUNT(*)', 'total')
        .andWhere('message.status IN (:...statuses)', {
          statuses: ['SENT', 'DELIVERED', 'READ', 'FAILED'],
        })
        .andWhere('message.updated_at >= :failedSince', { failedSince })
        .groupBy('message.status')
        .getRawMany<{ status: string; total: string }>(),
    ]);
    const completedTotal = completed.reduce((sum, item) => sum + Number(item.total), 0);
    const successful = completed
      .filter((item) => item.status !== 'FAILED')
      .reduce((sum, item) => sum + Number(item.total), 0);
    return {
      pendingMessages,
      failedLast24Hours,
      activePhoneNumbers,
      successRate: completedTotal ? Math.round((successful / completedTotal) * 1000) / 10 : 0,
    };
  }

  async getRecentMessages(tenantId?: string): Promise<DashboardRecentMessageDto[]> {
    const rows = await this.messageQuery(tenantId)
      .orderBy('message.created_at', 'DESC')
      .take(5)
      .getMany();
    return rows.map((row) => ({
      id: row.id,
      recipientLastFour: row.to.slice(-4),
      status: row.status,
      type: row.type,
      createdAt: row.createdAt,
    }));
  }

  private messageQuery(tenantId?: string): SelectQueryBuilder<MessageOrmEntity> {
    const query = this.messages.createQueryBuilder('message');
    return tenantId ? query.where('message.tenant_id = :tenantId', { tenantId }) : query;
  }

  private phoneNumberQuery(tenantId?: string): SelectQueryBuilder<PhoneNumberOrmEntity> {
    const query = this.phoneNumbers.createQueryBuilder('phone_number');
    if (!tenantId) return query;
    return query
      .innerJoin(
        WhatsAppAccountOrmEntity,
        'account',
        'account.id = phone_number.whatsapp_account_id',
      )
      .where('account.tenant_id = :tenantId', { tenantId });
  }
}
