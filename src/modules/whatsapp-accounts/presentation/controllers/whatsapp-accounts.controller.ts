import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { RegisterWhatsAppAccountCommand } from '../../application/commands/register-whatsapp-account.command';
import { GetWhatsAppAccountQuery } from '../../application/queries/get-whatsapp-account.query';
import { RegisterWhatsAppAccountRequestDto } from '../dto/register-whatsapp-account-request.dto';
import { WhatsAppAccountResponseDto } from '../dto/whatsapp-account-response.dto';

@ApiTags('whatsapp-accounts')
@Controller('v1/whatsapp-accounts')
export class WhatsAppAccountsController {
  constructor(@Inject(MEDIATOR) private readonly mediator: IMediator) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: HttpStatus.CREATED, type: WhatsAppAccountResponseDto })
  async register(
    @Body() dto: RegisterWhatsAppAccountRequestDto,
  ): Promise<WhatsAppAccountResponseDto> {
    const result = await this.mediator.send(
      new RegisterWhatsAppAccountCommand(dto.tenantId, dto.wabaId, dto.accessToken),
    );
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return WhatsAppAccountResponseDto.fromDto(result.value);
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, type: WhatsAppAccountResponseDto })
  async getById(@Param('id') id: string): Promise<WhatsAppAccountResponseDto> {
    const result = await this.mediator.query(new GetWhatsAppAccountQuery(id));
    if (result.isFailure) {
      throw toHttpException(result.error);
    }
    return WhatsAppAccountResponseDto.fromDto(result.value);
  }
}
