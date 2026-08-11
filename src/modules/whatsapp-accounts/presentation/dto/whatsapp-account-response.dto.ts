import { ApiProperty } from '@nestjs/swagger';
import { WhatsAppAccountDto } from '../../application/dto/whatsapp-account.dto';

export class WhatsAppAccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  wabaId!: string;

  @ApiProperty({ enum: ['default', 'tenant'] })
  credentialSource!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDto(dto: WhatsAppAccountDto): WhatsAppAccountResponseDto {
    const response = new WhatsAppAccountResponseDto();
    response.id = dto.id;
    response.tenantId = dto.tenantId;
    response.wabaId = dto.wabaId;
    response.credentialSource = dto.credentialSource;
    response.status = dto.status;
    response.createdAt = dto.createdAt;
    return response;
  }
}
