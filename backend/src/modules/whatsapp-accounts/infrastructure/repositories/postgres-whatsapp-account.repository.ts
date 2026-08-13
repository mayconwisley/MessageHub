import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { UniqueId } from '@shared/domain';
import {
  WhatsAppAccount,
  WhatsAppAccountProps,
} from '../../domain/entities/whatsapp-account.entity';
import { WhatsAppAccountStatus } from '../../domain/enums/whatsapp-account-status.enum';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';
import {
  IWhatsAppAccountRepository,
  ListWhatsAppAccountsFilter,
} from '../../domain/repositories/whatsapp-account.repository.interface';
import { WhatsAppAccountOrmEntity } from '../entities/whatsapp-account.orm-entity';
import { AccessTokenCipherService } from '../security/access-token-cipher.service';
import { PaginatedResult } from '@shared/types';

@Injectable()
export class PostgresWhatsAppAccountRepository implements IWhatsAppAccountRepository {
  constructor(
    @InjectRepository(WhatsAppAccountOrmEntity)
    private readonly repository: Repository<WhatsAppAccountOrmEntity>,
    private readonly accessTokenCipher: AccessTokenCipherService,
  ) {}

  async save(whatsAppAccount: WhatsAppAccount): Promise<void> {
    await this.repository.save(this.toOrmEntity(whatsAppAccount));
  }

  async findById(id: UniqueId): Promise<WhatsAppAccount | null> {
    const row = await this.repository.findOne({ where: { id: id.value } });
    return row ? this.hydrate(row) : null;
  }

  async findByTenantAndWabaId(tenantId: UniqueId, wabaId: string): Promise<WhatsAppAccount | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value, wabaId } });
    return row ? this.hydrate(row) : null;
  }

  private async hydrate(row: WhatsAppAccountOrmEntity): Promise<WhatsAppAccount> {
    const accessToken = row.encryptedAccessToken
      ? this.decryptAccessToken(row.encryptedAccessToken)
      : null;
    const appSecret = row.encryptedAppSecret
      ? this.decryptAccessToken(row.encryptedAppSecret)
      : null;

    if (row.encryptedAccessToken && !this.isEncrypted(row.encryptedAccessToken)) {
      const encryptedAccessToken = this.accessTokenCipher.encrypt(accessToken as string);
      await this.repository.update(row.id, { encryptedAccessToken });
      row.encryptedAccessToken = encryptedAccessToken;
    }

    return this.toDomain(row, accessToken, appSecret);
  }

  async listByTenantId(
    tenantId: UniqueId,
    page: number,
    pageSize: number,
    filter?: ListWhatsAppAccountsFilter,
  ): Promise<PaginatedResult<WhatsAppAccount>> {
    const where: FindOptionsWhere<WhatsAppAccountOrmEntity> = {
      tenantId: tenantId.value,
      ...(filter?.status ? { status: filter.status } : {}),
    };
    if (filter?.search) where.wabaId = ILike(`%${filter.search}%`);

    const [rows, total] = await this.repository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items: rows.map((row) => this.toDomain(row)), total, page, pageSize };
  }

  async findIdsByTenantId(tenantId: UniqueId): Promise<UniqueId[]> {
    const rows = await this.repository.find({
      where: { tenantId: tenantId.value },
      select: { id: true },
    });
    return rows.map((row) => UniqueId.create(row.id));
  }

  private toOrmEntity(account: WhatsAppAccount): WhatsAppAccountOrmEntity {
    const orm = new WhatsAppAccountOrmEntity();
    orm.id = account.id.value;
    orm.tenantId = account.tenantId.value;
    orm.wabaId = account.wabaId;
    orm.credentialSource = account.credentialSource;
    orm.encryptedAccessToken = account.accessToken
      ? this.accessTokenCipher.encrypt(account.accessToken)
      : null;
    orm.encryptedAppSecret = account.appSecret
      ? this.accessTokenCipher.encrypt(account.appSecret)
      : null;
    orm.status = account.status;
    orm.credentialExpiresAt = account.credentialExpiresAt;
    orm.createdAt = account.createdAt;
    return orm;
  }

  private toDomain(
    row: WhatsAppAccountOrmEntity,
    accessToken?: string | null,
    appSecret?: string | null,
  ): WhatsAppAccount {
    const props: WhatsAppAccountProps = {
      tenantId: UniqueId.create(row.tenantId),
      wabaId: row.wabaId,
      credentialSource: row.credentialSource as WhatsAppCredentialSource,
      accessToken: accessToken ?? null,
      appSecret: appSecret ?? null,
      credentialExpiresAt: row.credentialExpiresAt,
      status: row.status as WhatsAppAccountStatus,
      createdAt: row.createdAt,
    };
    return WhatsAppAccount.reconstitute(props, UniqueId.create(row.id));
  }

  private decryptAccessToken(value: string): string {
    return this.isEncrypted(value) ? this.accessTokenCipher.decrypt(value) : value;
  }

  private isEncrypted(value: string): boolean {
    return value.startsWith('v1.');
  }
}
