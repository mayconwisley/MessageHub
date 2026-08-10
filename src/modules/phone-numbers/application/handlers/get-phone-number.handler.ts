import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PhoneNumberNotFoundError } from '../../domain/errors/phone-number-not-found.error';
import {
  IPhoneNumberRepository,
  PHONE_NUMBER_REPOSITORY,
} from '../../domain/repositories/phone-number.repository.interface';
import { PhoneNumberDto } from '../dto/phone-number.dto';
import { PhoneNumberMapper } from '../mappers/phone-number.mapper';
import { GetPhoneNumberQuery } from '../queries/get-phone-number.query';

@QueryHandler(GetPhoneNumberQuery)
export class GetPhoneNumberHandler implements IQueryHandler<GetPhoneNumberQuery> {
  constructor(
    @Inject(PHONE_NUMBER_REPOSITORY) private readonly phoneNumberRepository: IPhoneNumberRepository,
  ) {}

  async execute(
    query: GetPhoneNumberQuery,
  ): Promise<Result<PhoneNumberDto, PhoneNumberNotFoundError>> {
    const phoneNumber = await this.phoneNumberRepository.findById(
      UniqueId.create(query.phoneNumberId),
    );
    if (!phoneNumber) {
      return Result.fail(new PhoneNumberNotFoundError(query.phoneNumberId));
    }

    return Result.ok(PhoneNumberMapper.toDto(phoneNumber));
  }
}
