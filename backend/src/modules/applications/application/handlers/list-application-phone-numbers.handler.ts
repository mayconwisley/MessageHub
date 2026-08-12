import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '@modules/phone-numbers/domain/repositories/phone-number.repository.interface';
import { ApplicationNotFoundError } from '../../domain/errors/application-not-found.error';
import {
  APPLICATION_REPOSITORY,
  IApplicationRepository,
} from '../../domain/repositories/application.repository.interface';
import {
  APPLICATION_PHONE_NUMBER_LINK_REPOSITORY,
  IApplicationPhoneNumberLinkRepository,
} from '../../domain/repositories/application-phone-number-link.repository.interface';
import { LinkedPhoneNumberDto } from '../dto/linked-phone-number.dto';
import { ListApplicationPhoneNumbersQuery } from '../queries/list-application-phone-numbers.query';

@QueryHandler(ListApplicationPhoneNumbersQuery)
export class ListApplicationPhoneNumbersHandler implements IQueryHandler<ListApplicationPhoneNumbersQuery> {
  constructor(
    @Inject(APPLICATION_REPOSITORY) private readonly applications: IApplicationRepository,
    @Inject(APPLICATION_PHONE_NUMBER_LINK_REPOSITORY)
    private readonly links: IApplicationPhoneNumberLinkRepository,
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumbers: IPhoneNumberRepository,
  ) {}

  async execute(
    query: ListApplicationPhoneNumbersQuery,
  ): Promise<Result<LinkedPhoneNumberDto[], ApplicationNotFoundError>> {
    const applicationId = UniqueId.create(query.applicationId);
    const application = await this.applications.findById(applicationId);
    if (!application) {
      return Result.fail(new ApplicationNotFoundError(query.applicationId));
    }

    const phoneNumberIds = await this.links.listPhoneNumberIdsByApplication(applicationId);
    const phoneNumbers = await Promise.all(
      phoneNumberIds.map((id) => this.phoneNumbers.findById(id)),
    );

    return Result.ok(
      phoneNumbers
        .filter((phoneNumber): phoneNumber is NonNullable<typeof phoneNumber> => !!phoneNumber)
        .map((phoneNumber) => ({
          id: phoneNumber.id.value,
          phoneNumberId: phoneNumber.phoneNumberId,
          displayNumber: phoneNumber.displayNumber,
        })),
    );
  }
}
