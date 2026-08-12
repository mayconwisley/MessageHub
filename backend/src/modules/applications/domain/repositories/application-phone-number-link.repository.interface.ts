import { UniqueId } from '@shared/domain';

export interface IApplicationPhoneNumberLinkRepository {
  replaceForApplication(applicationId: UniqueId, phoneNumberIds: UniqueId[]): Promise<void>;
  listPhoneNumberIdsByApplication(applicationId: UniqueId): Promise<UniqueId[]>;
  listApplicationIdsByPhoneNumber(phoneNumberId: UniqueId): Promise<UniqueId[]>;
}

export const APPLICATION_PHONE_NUMBER_LINK_REPOSITORY = Symbol(
  'APPLICATION_PHONE_NUMBER_LINK_REPOSITORY',
);
