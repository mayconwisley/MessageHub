import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { WhatsAppAccount } from '../../domain/entities/whatsapp-account.entity';
import { WhatsAppCredentialSource } from '../../domain/enums/whatsapp-credential-source.enum';
import { DefaultChannelNotConfiguredError, InvalidWhatsAppAccountError } from '../../domain/errors';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/whatsapp-account.repository.interface';
import { EnsureDefaultChannelAccountCommand } from '../commands/ensure-default-channel-account.command';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
import { WhatsAppAccountMapper } from '../mappers/whatsapp-account.mapper';

/** Resolve (ou cria) a WhatsAppAccount do canal padrão da plataforma para um tenant, evitando digitar o WABA ID do .env na tela. */
@CommandHandler(EnsureDefaultChannelAccountCommand)
export class EnsureDefaultChannelAccountHandler implements ICommandHandler<EnsureDefaultChannelAccountCommand> {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async execute(
    command: EnsureDefaultChannelAccountCommand,
  ): Promise<
    Result<
      WhatsAppAccountDto,
      DefaultChannelNotConfiguredError | TenantNotFoundError | InvalidWhatsAppAccountError
    >
  > {
    const wabaId = this.metaConfig.defaultWabaId;
    if (!this.metaConfig.defaultChannelEnabled || !wabaId) {
      return Result.fail(new DefaultChannelNotConfiguredError());
    }

    const tenantId = UniqueId.create(command.tenantId);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(command.tenantId));
    }

    const existing = await this.whatsAppAccountRepository.findByTenantAndWabaId(tenantId, wabaId);
    if (existing) {
      return Result.ok(WhatsAppAccountMapper.toDto(existing));
    }

    const accountResult = WhatsAppAccount.create({
      tenantId,
      wabaId,
      credentialSource: WhatsAppCredentialSource.DEFAULT,
    });
    if (accountResult.isFailure) {
      return Result.fail(accountResult.error);
    }

    const account = accountResult.value;
    await this.whatsAppAccountRepository.save(account);
    return Result.ok(WhatsAppAccountMapper.toDto(account));
  }
}
