import { Query } from '@shared/mediator';
import { Result } from '@shared/result';
import { PaginatedResult } from '@shared/types';
import { PhoneNumberDto } from '../dto/phone-number.dto';
export class ListPhoneNumbersQuery extends Query<Result<PaginatedResult<PhoneNumberDto>>> { constructor(public readonly tenantId: string, public readonly page: number, public readonly pageSize: number) { super(); } }
