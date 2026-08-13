import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { TenantNotFoundError } from '@modules/tenants/domain/errors';
import {
  ITenantRepository,
  TENANT_REPOSITORY,
} from '@modules/tenants/domain/repositories/tenant.repository.interface';
import { WhatsAppAccount } from '../../domain/entities/whatsapp-account.entity';
import { InvalidWhatsAppAccountError } from '../../domain/errors/invalid-whatsapp-account.error';
import {
  IWhatsAppAccountRepository,
  WHATSAPP_ACCOUNT_REPOSITORY,
} from '../../domain/repositories/whatsapp-account.repository.interface';
import { RegisterWhatsAppAccountCommand } from '../commands/register-whatsapp-account.command';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';
import { WhatsAppAccountMapper } from '../mappers/whatsapp-account.mapper';

@CommandHandler(RegisterWhatsAppAccountCommand)
export class RegisterWhatsAppAccountHandler implements ICommandHandler<RegisterWhatsAppAccountCommand> {
  constructor(
    @Inject(WHATSAPP_ACCOUNT_REPOSITORY)
    private readonly whatsAppAccountRepository: IWhatsAppAccountRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    command: RegisterWhatsAppAccountCommand,
  ): Promise<Result<WhatsAppAccountDto, InvalidWhatsAppAccountError | TenantNotFoundError>> {
    const tenantId = UniqueId.create(command.tenantId);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      return Result.fail(new TenantNotFoundError(command.tenantId));
    }

    const accountResult = WhatsAppAccount.create({
      tenantId,
      wabaId: command.wabaId,
      credentialSource: command.credentialSource,
      accessToken: command.accessToken,
      appSecret: command.appSecret,
      credentialExpiresAt: command.credentialExpiresAt,
    });
    if (accountResult.isFailure) {
      return Result.fail(accountResult.error);
    }

    const account = accountResult.value;
    await this.whatsAppAccountRepository.save(account);

    return Result.ok(WhatsAppAccountMapper.toDto(account));
  }
}
