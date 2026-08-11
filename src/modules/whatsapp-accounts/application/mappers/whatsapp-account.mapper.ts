import { WhatsAppAccount } from '../../domain/entities/whatsapp-account.entity';
import { WhatsAppAccountDto } from '../dto/whatsapp-account.dto';

export class WhatsAppAccountMapper {
  static toDto(whatsAppAccount: WhatsAppAccount): WhatsAppAccountDto {
    return {
      id: whatsAppAccount.id.value,
      tenantId: whatsAppAccount.tenantId.value,
      wabaId: whatsAppAccount.wabaId,
      credentialSource: whatsAppAccount.credentialSource,
      status: whatsAppAccount.status,
      createdAt: whatsAppAccount.createdAt,
    };
  }
}
