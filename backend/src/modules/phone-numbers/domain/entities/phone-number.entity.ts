import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { PhoneNumberStatus } from '../enums/phone-number-status.enum';
import { InvalidPhoneNumberError } from '../errors/invalid-phone-number.error';

export interface PhoneNumberProps {
  whatsAppAccountId: UniqueId;
  phoneNumberId: string;
  displayNumber: string;
  status: PhoneNumberStatus;
  createdAt: Date;
}

export interface RegisterPhoneNumberParams {
  whatsAppAccountId: UniqueId;
  phoneNumberId: string;
  displayNumber: string;
}

export class PhoneNumber extends Entity<PhoneNumberProps> {
  private constructor(props: PhoneNumberProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: RegisterPhoneNumberParams,
    id?: UniqueId,
  ): Result<PhoneNumber, InvalidPhoneNumberError> {
    const phoneNumberId = params.phoneNumberId?.trim();
    if (!phoneNumberId) {
      return Result.fail(new InvalidPhoneNumberError('phoneNumberId não deve estar vazio.'));
    }

    const displayNumber = params.displayNumber?.trim();
    if (!displayNumber) {
      return Result.fail(new InvalidPhoneNumberError('displayNumber não deve estar vazio.'));
    }

    return Result.ok(
      new PhoneNumber(
        {
          whatsAppAccountId: params.whatsAppAccountId,
          phoneNumberId,
          displayNumber,
          status: PhoneNumberStatus.ACTIVE,
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: PhoneNumberProps, id: UniqueId): PhoneNumber {
    return new PhoneNumber(props, id);
  }

  get whatsAppAccountId(): UniqueId {
    return this.props.whatsAppAccountId;
  }

  get phoneNumberId(): string {
    return this.props.phoneNumberId;
  }

  get displayNumber(): string {
    return this.props.displayNumber;
  }

  get status(): PhoneNumberStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === PhoneNumberStatus.ACTIVE;
  }

  suspend(): void {
    this.props.status = PhoneNumberStatus.SUSPENDED;
  }
}
