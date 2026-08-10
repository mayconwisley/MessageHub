import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { RegisterPhoneNumberCommand } from '../../application/commands/register-phone-number.command';
import { GetPhoneNumberQuery } from '../../application/queries/get-phone-number.query';
import { PhoneNumberResponseDto } from '../dto/phone-number-response.dto';
import { RegisterPhoneNumberRequestDto } from '../dto/register-phone-number-request.dto';

@ApiTags('phone-numbers')
@Controller('v1/phone-numbers')
export class PhoneNumbersController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: PhoneNumberResponseDto })
  async register(@Body() dto: RegisterPhoneNumberRequestDto): Promise<PhoneNumberResponseDto> {
    const result = await this.mediator.send(
      new RegisterPhoneNumberCommand(dto.whatsAppAccountId, dto.phoneNumberId, dto.displayNumber),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return PhoneNumberResponseDto.fromDto(result.value);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: PhoneNumberResponseDto })
  async getById(@Param('id') id: string): Promise<PhoneNumberResponseDto> {
    const result = await this.mediator.query(new GetPhoneNumberQuery(id));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return PhoneNumberResponseDto.fromDto(result.value);
  }
}
