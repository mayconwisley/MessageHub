import { UniqueId } from '@shared/domain';
import { WhatsAppAccount } from '../entities/whatsapp-account.entity';

export interface IWhatsAppAccountRepository {
  save(whatsAppAccount: WhatsAppAccount): Promise<void>;
  findById(id: UniqueId): Promise<WhatsAppAccount | null>;
}

export const WHATSAPP_ACCOUNT_REPOSITORY = Symbol('WHATSAPP_ACCOUNT_REPOSITORY');
