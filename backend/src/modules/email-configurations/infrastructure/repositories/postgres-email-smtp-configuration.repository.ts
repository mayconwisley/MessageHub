import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UniqueId } from '@shared/domain';
import { Repository } from 'typeorm';
import {
  EmailSmtpConfiguration,
  EmailSmtpConfigurationProps,
} from '../../domain/entities/email-smtp-configuration.entity';
import { IEmailSmtpConfigurationRepository } from '../../domain/repositories/email-smtp-configuration.repository.interface';
import { EmailSmtpConfigurationOrmEntity } from '../entities/email-smtp-configuration.orm-entity';
import { SmtpPasswordCipherService } from '../security/smtp-password-cipher.service';

@Injectable()
export class PostgresEmailSmtpConfigurationRepository implements IEmailSmtpConfigurationRepository {
  constructor(
    @InjectRepository(EmailSmtpConfigurationOrmEntity)
    private readonly repository: Repository<EmailSmtpConfigurationOrmEntity>,
    private readonly cipher: SmtpPasswordCipherService,
  ) {}

  async save(configuration: EmailSmtpConfiguration): Promise<void> {
    await this.repository.save(this.toOrm(configuration));
  }

  async findByTenantId(tenantId: UniqueId): Promise<EmailSmtpConfiguration | null> {
    const row = await this.repository.findOne({ where: { tenantId: tenantId.value } });
    return row ? this.toDomain(row) : null;
  }

  async delete(configuration: EmailSmtpConfiguration): Promise<void> {
    await this.repository.delete(configuration.id.value);
  }

  private toOrm(configuration: EmailSmtpConfiguration): EmailSmtpConfigurationOrmEntity {
    const row = new EmailSmtpConfigurationOrmEntity();
    row.id = configuration.id.value;
    row.tenantId = configuration.tenantId.value;
    row.host = configuration.host;
    row.port = configuration.port;
    row.secure = configuration.secure;
    row.username = configuration.username;
    row.encryptedPassword = this.cipher.encrypt(configuration.password);
    row.fromEmail = configuration.fromEmail;
    row.fromName = configuration.fromName;
    row.createdAt = configuration.createdAt;
    row.updatedAt = configuration.updatedAt;
    return row;
  }

  private toDomain(row: EmailSmtpConfigurationOrmEntity): EmailSmtpConfiguration {
    const props: EmailSmtpConfigurationProps = {
      tenantId: UniqueId.create(row.tenantId),
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username,
      password: this.cipher.decrypt(row.encryptedPassword),
      fromEmail: row.fromEmail,
      fromName: row.fromName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return EmailSmtpConfiguration.reconstitute(props, UniqueId.create(row.id));
  }
}
